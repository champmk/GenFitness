# GenFitness - AI-Powered Workout Generator (WORK IN PROGRESS!)

A modern web application that generates personalized workout plans using AI. The application supports both powerlifting and bodybuilding focuses, with customized programming based on user experience, goals, and available equipment.

Created by Champ Mukiza.

## Features

- **AI-Powered Workout Generation**: Creates personalized workout plans using GPT4All
- **Specialized Programs**:
  - Powerlifting programs with 1RM-based calculations
  - Bodybuilding programs for muscle gain or fat loss
- **Program Types**:
  - Microcycle (1 week)
  - Mesocycle (2-8 weeks)
  - Macrocycle (12-16 weeks)
  - Block Periodization
- **Injury Consideration**: Takes into account current injuries and their severity
- **Equipment Adaptation**: Customizes workouts based on available equipment
- **Excel Export**: Generates downloadable workout plans in Excel format

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express
- **AI Integration**: GPT4All (local LLM)
- **Storage**: AWS S3
- **Styling**: Custom CSS with modern design principles

## Prerequisites

- Node.js (v14 or higher)
- GPT4All running locally on port 4891
- AWS Account with S3 bucket
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd workout-storage
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in your AWS credentials and other required variables

4. Start the development servers:
   ```bash
   # Start the back end using:
   npm start

   # Start the front end using:
   npm run dev
   ```

5. Ensure GPT4All is running locally on port 4891

## Environment Variables

### Backend (.env)
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET=your_bucket_name
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## Usage

1. Visit `http://localhost:3000` in your browser
2. Select your training focus (Powerlifting or Bodybuilding)
3. Fill in your training details and preferences
4. Click "Generate Program"
5. Download your personalized workout plan

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License with an additional attribution requirement - see the LICENSE file for details. Any use of this software must include clear and visible attribution to the original author, Champ Mukiza. 
