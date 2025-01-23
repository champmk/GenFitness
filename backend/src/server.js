const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const ExcelJS = require('exceljs');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json());

// S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to generate Excel file from workout plan
async function createWorkoutExcel(workoutPlan) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Workout Plan');

  // Set up headers
  worksheet.columns = [
    { header: 'Day', key: 'day', width: 15 },
    { header: 'Exercise', key: 'exercise', width: 30 },
    { header: 'Sets', key: 'sets', width: 10 },
    { header: 'Reps', key: 'reps', width: 10 },
    { header: 'Rest (sec)', key: 'rest', width: 15 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4D4D4D' }
  };

  // Add the workout data
  workoutPlan.exercises.forEach((day) => {
    day.exercises.forEach((exercise) => {
      worksheet.addRow({
        day: day.day,
        exercise: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        notes: exercise.notes || ''
      });
    });
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

// Routes
app.post('/api/workouts', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { title, description, targetMuscles, difficulty } = req.body;
    
    const key = `workouts/${Date.now()}-${file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    // Here you would typically save metadata to a database
    res.json({ success: true, key });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/workouts', async (req, res) => {
  // Here you would typically fetch from a database
  res.json([]);
});

app.get('/api/workouts/:id/download', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: req.params.id,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ downloadUrl: url });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.get('/api/workout-plans', async (req, res) => {
  try {
    console.log('Fetching workout plans from S3...');
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      // List all Excel files, not just those in templates/
    });
    
    const response = await s3Client.send(command);
    console.log('S3 Response:', response);
    
    const plans = response.Contents
      ?.filter(item => item.Key.endsWith('.xlsx') && !item.Key.startsWith('generated/'))
      .map(item => ({
        id: item.Key,
        title: item.Key.replace('.xlsx', '').split('-').join(' '),
        size: item.Size,
        lastModified: item.LastModified
      })) || [];
    
    console.log('Sending plans:', plans);
    res.json(plans);
  } catch (error) {
    console.error('Error listing workout plans:', error);
    res.status(500).json({ error: 'Failed to list workout plans', details: error.message });
  }
});

app.post('/api/generate-workout', async (req, res) => {
  try {
    const { programType, name, type, duration, date } = req.body;
    
    // Create prompt for GPT4All with explicit instructions for JSON-only response
    const workout_plan_prompt = `You are a JSON generator for workout plans. Respond ONLY with a valid JSON object, no additional text before or after. Generate a detailed ${programType} workout program with these specifications:
    Program Name: ${name}
    Training Focus: ${type}
    Session Duration: ${duration} minutes
    Start Date: ${date}

    The response must be a single JSON object in this exact format, with ALL fields included for EVERY exercise:
    {
      "programName": "string",
      "type": "string",
      "duration": "string",
      "exercises": [
        {
          "day": "string",
          "exercises": [
            {
              "name": "string",
              "sets": number,
              "reps": "string",
              "rest": number,
              "notes": "string"
            }
          ]
        }
      ]
    }
    
    For rest days, use this format:
    {
      "day": "Rest Day",
      "exercises": [
        {
          "name": "Rest",
          "sets": 0,
          "reps": "N/A",
          "rest": 0,
          "notes": "Recovery day"
        }
      ]
    }`;

    // Call GPT4All API
    const gpt4allResponse = await fetch('http://localhost:4891/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Llama 3 8B Instruct",
        messages: [{ role: "user", content: workout_plan_prompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!gpt4allResponse.ok) {
      throw new Error('Failed to generate workout plan');
    }

    const gptData = await gpt4allResponse.json();
    let content = gptData.choices[0].message.content;
    
    // Clean up the response to ensure it's valid JSON
    // Remove any non-printable characters and whitespace from the start and end
    content = content.replace(/^\s+|\uFEFF|\s+$/g, '');
    
    // Remove any text before the first {
    content = content.substring(content.indexOf('{'));
    
    // Count opening and closing braces/brackets to ensure proper structure
    let openBraces = (content.match(/{/g) || []).length;
    let closeBraces = (content.match(/}/g) || []).length;
    let openBrackets = (content.match(/\[/g) || []).length;
    let closeBrackets = (content.match(/\]/g) || []).length;

    // Add missing closing brackets/braces if needed
    if (openBrackets > closeBrackets) {
      content += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      content += '}'.repeat(openBraces - closeBraces);
    }

    // Validate the structure before parsing
    if (!content.startsWith('{') || !content.endsWith('}')) {
      throw new Error('Invalid JSON structure in response');
    }

    // Parse the cleaned JSON
    let workoutPlan;
    try {
      workoutPlan = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to clean up the JSON further
      try {
        // Remove any trailing commas before closing brackets/braces
        content = content.replace(/,(\s*[}\]])/g, '$1');
        workoutPlan = JSON.parse(content);
      } catch (finalError) {
        console.error('JSON Parse Error:', finalError);
        console.error('Content attempting to parse:', content);
        throw new Error('Failed to parse workout plan JSON');
      }
    }

    // Validate and normalize the workout plan structure
    workoutPlan.exercises = workoutPlan.exercises.map(day => {
      // Handle rest days
      if (day.exercises.length === 1 && (day.exercises[0].name === "Rest Day" || day.exercises[0].name === "Rest")) {
        return {
          day: day.day,
          exercises: [{
            name: "Rest",
            sets: 0,
            reps: "N/A",
            rest: 0,
            notes: "Recovery day"
          }]
        };
      }
      return day;
    });

    // Generate Excel file
    const excelBuffer = await createWorkoutExcel(workoutPlan);

    // Upload to S3 in a separate folder for generated workouts
    const key = `generated/${Date.now()}-${name.replace(/\s+/g, '-')}.xlsx`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: excelBuffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));

    // Generate download URL
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });
    
    const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    
    res.json({
      success: true,
      downloadUrl,
      plan: workoutPlan
    });

  } catch (error) {
    console.error('Workout generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate workout plan',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 