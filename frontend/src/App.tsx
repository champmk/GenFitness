import React, { useState, useEffect } from 'react';

interface Workout {
  id: number;
  name: string;
  type: string;
  duration: number;
  date: string;
  programType?: string;  // Add programType to track periodization
}

interface WorkoutPlan {
  id: string;  // This is the S3 key
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  category: string;
  imageUrl: string;
  size?: number;
  lastModified?: Date;
}

interface PowerliftingStats {
  squatMax: string;
  benchMax: string;
  deadliftMax: string;
}

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState('');
  const [programType, setProgramType] = useState('microcycle');
  const [generatedWorkout, setGeneratedWorkout] = useState<{ downloadUrl: string; plan: any } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trainingFocus, setTrainingFocus] = useState('');
  const [trainingExperience, setTrainingExperience] = useState('');
  const [trainingFrequency, setTrainingFrequency] = useState('');
  const [injuries, setInjuries] = useState('');
  const [injurySeverity, setInjurySeverity] = useState('');
  const [goals, setGoals] = useState('');
  const [equipment, setEquipment] = useState('');
  const [powerliftingStats, setPowerliftingStats] = useState<PowerliftingStats>({
    squatMax: '',
    benchMax: '',
    deadliftMax: ''
  });

  // Fetch workout plans from backend
  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      try {
        console.log('Fetching workout plans...');
        const response = await fetch('http://localhost:3001/api/workout-plans');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch workout plans: ${errorData.details || response.statusText}`);
        }
        const data = await response.json();
        console.log('Received workout plans:', data);
        
        setWorkoutPlans(data.map((plan: any) => ({
          id: plan.id,
          title: plan.title,
          description: "Professional workout plan",
          difficulty: "All Levels",
          duration: "Variable",
          category: "Fitness",
          imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format",
          size: plan.size,
          lastModified: new Date(plan.lastModified)
        })));
      } catch (error) {
        console.error('Error fetching workout plans:', error);
      }
    };

    fetchWorkoutPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3001/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programType,
          name,
          type: trainingFocus,
          duration,
          date,
          trainingExperience,
          trainingFrequency,
          injuries,
          injurySeverity,
          goals,
          equipment,
          ...(trainingFocus === 'Powerlifting' ? { powerliftingStats } : {})
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate workout plan');
      }

      const data = await response.json();
      setGeneratedWorkout(data);
      
      // Wait for state to update and DOM to render
      setTimeout(() => {
        const downloadSection = document.getElementById('download-section');
        if (downloadSection) {
          downloadSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);

    } catch (error) {
      console.error('Error generating workout:', error);
      alert('Failed to generate workout plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    // ... existing delete logic ...
  };

  const handleDownload = async (planId: string) => {
    try {
      console.log('Downloading plan:', planId);
      const response = await fetch(`http://localhost:3001/api/workouts/${planId}/download`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get download URL: ${errorData.details || response.statusText}`);
      }
      const { downloadUrl } = await response.json();
      console.log('Got download URL:', downloadUrl);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${planId.split('/').pop() || 'workout-plan.xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading workout plan:', error);
      alert('Failed to download workout plan. Please try again.');
    }
  };

  const scrollToContent = () => {
    const contentSection = document.getElementById('content-section');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>G E N F I T N E S S</h1>
        </div>
      </header>

      <section className="hero-section">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hero-video"
          onError={(e) => console.error('Video loading error:', e)}
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-content">
          <button onClick={scrollToContent} className="hero-button">
            START YOUR JOURNEY
          </button>
        </div>
      </section>

      <main className="container" id="content-section">
        {/* Workout Plans Catalog Section */}
        <section className="workout-plans-section">
          <h2>Available Workout Plans</h2>
          {workoutPlans.length === 0 ? (
            <p className="no-plans">Loading workout plans...</p>
          ) : (
            <div className="workout-plans-grid">
              {workoutPlans.map((plan) => (
                <div key={plan.id} className="plan-card">
                  <div className="plan-content">
                    <h3>{plan.title}</h3>
                    <div className="plan-details">
                      <span className="badge">Size: {plan.size ? Math.round(plan.size / 1024) : 0} KB</span>
                      <span className="badge">Last Modified: {plan.lastModified?.toLocaleDateString() || 'N/A'}</span>
                    </div>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(plan.id)}
                    >
                      Download Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Workout Generator Section */}
        <section className="workout-tracker-section">
          <h2>Generate Your Fitness Program</h2>
          <form className="workout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="programType">Program Type:</label>
              <select
                id="programType"
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                required
              >
                <option value="microcycle">Microcycle (1 week program)</option>
                <option value="mesocycle">Mesocycle (2-8 weeks program)</option>
                <option value="macrocycle">Macrocycle (12-16 weeks program)</option>
                <option value="block">Block Periodization</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Program Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Session Duration (minutes):</label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Start Date:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="trainingFocus">Training Focus:</label>
              <select
                id="trainingFocus"
                value={trainingFocus}
                onChange={(e) => setTrainingFocus(e.target.value)}
                required
              >
                <option value="">Select a focus</option>
                <option value="Powerlifting">Powerlifting</option>
                <option value="Bodybuilding">Bodybuilding</option>
              </select>
            </div>

            {trainingFocus && (
              <>
                <div className="form-group">
                  <label htmlFor="trainingExperience">Training Experience (years):</label>
                  <input
                    type="number"
                    id="trainingExperience"
                    value={trainingExperience}
                    onChange={(e) => setTrainingExperience(e.target.value)}
                    min="0"
                    step="0.5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="trainingFrequency">Training Frequency (days per week):</label>
                  <input
                    type="number"
                    id="trainingFrequency"
                    value={trainingFrequency}
                    onChange={(e) => setTrainingFrequency(e.target.value)}
                    min="1"
                    max="7"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="injuries">Current Injuries (if any):</label>
                  <textarea
                    id="injuries"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value)}
                    placeholder="Describe any current injuries..."
                  />
                </div>

                {injuries && (
                  <div className="form-group">
                    <label htmlFor="injurySeverity">Injury Severity:</label>
                    <select
                      id="injurySeverity"
                      value={injurySeverity}
                      onChange={(e) => setInjurySeverity(e.target.value)}
                      required
                    >
                      <option value="">Select severity</option>
                      <option value="Mild">Mild - Slight discomfort</option>
                      <option value="Moderate">Moderate - Some limitation</option>
                      <option value="Severe">Severe - Significant limitation</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="goals">Goals:</label>
                  <select
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    required
                  >
                    <option value="">Select your goal</option>
                    {trainingFocus === 'Powerlifting' ? (
                      <>
                        <option value="Meet Prep">Meet Prep</option>
                        <option value="Strength">Strength</option>
                        <option value="Injury Comeback">Injury Comeback</option>
                      </>
                    ) : (
                      <>
                        <option value="Gain Muscle">Gain Muscle</option>
                        <option value="Lose Fat">Lose Fat</option>
                        <option value="Injury Comeback">Injury Comeback</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="equipment">Available Equipment:</label>
                  <textarea
                    id="equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="List your available equipment..."
                    required
                  />
                </div>

                {trainingFocus === 'Powerlifting' && (
                  <div className="powerlifting-stats">
                    <h3>One Rep Maxes (lbs)</h3>
                    <div className="form-group">
                      <label htmlFor="squatMax">Squat 1RM:</label>
                      <input
                        type="number"
                        id="squatMax"
                        value={powerliftingStats.squatMax}
                        onChange={(e) => setPowerliftingStats(prev => ({ ...prev, squatMax: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="benchMax">Bench Press 1RM:</label>
                      <input
                        type="number"
                        id="benchMax"
                        value={powerliftingStats.benchMax}
                        onChange={(e) => setPowerliftingStats(prev => ({ ...prev, benchMax: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="deadliftMax">Deadlift 1RM:</label>
                      <input
                        type="number"
                        id="deadliftMax"
                        value={powerliftingStats.deadliftMax}
                        onChange={(e) => setPowerliftingStats(prev => ({ ...prev, deadliftMax: e.target.value }))}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={isGenerating}>
              {isGenerating ? 'Generating Program...' : 'Generate Program'}
            </button>
          </form>

          {/* Generated Workout Download Section */}
          {generatedWorkout && (
            <div id="download-section" className="program-download-section">
              <h3>Your Personalized Workout Plan is Ready!</h3>
              <div className="program-summary">
                <p><strong>Program Name:</strong> {generatedWorkout.plan.programName}</p>
                <p><strong>Type:</strong> {generatedWorkout.plan.type}</p>
                <p><strong>Duration:</strong> {generatedWorkout.plan.duration}</p>
              </div>
              <button 
                className="download-btn"
                onClick={() => window.open(generatedWorkout.downloadUrl, '_blank')}
              >
                Download Your Program
              </button>
            </div>
          )}

          <div className="workout-list">
            {workouts.map((workout) => (
              <div key={workout.id} className="workout-card">
                <h3>{workout.name}</h3>
                <div className="workout-info">
                  <strong>Type:</strong> {workout.type}
                </div>
                <div className="workout-info">
                  <strong>Duration:</strong> {workout.duration} minutes
                </div>
                <div className="workout-info">
                  <strong>Date:</strong> {new Date(workout.date).toLocaleDateString()}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(workout.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App; 