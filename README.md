# IF Ultimate Calc - Infinite Flight Speed Calculator

A professional web application for calculating takeoff and landing speeds for aircraft in the Infinite Flight simulator. Features real-time METAR integration, smart runway selection, and accurate physics-based speed calculations.

## Features

- **Comprehensive Aircraft Database**: Pre-configured data for Airbus, Boeing, Regional, GA, and Military aircraft
- **METAR Integration**: Real-time weather data from VATSIM METAR service
- **Smart Runway Analysis**: Automatic headwind/crosswind calculation and best runway recommendation
- **Accurate Speed Calculations**: Physics-based V1, VR, V2, VREF, and VAPP calculations
- **Modern Avionics UI**: Dark theme with professional cockpit-inspired design
- **Mobile Responsive**: Optimized for touch screens and mobile devices

## Technologies Used

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Shadcn UI components
- Lucide React icons

## Local Development

### Prerequisites

- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation Steps

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:8080`

## Deployment to Vercel (Step-by-Step)

This guide will walk you through deploying your IF Ultimate Calc application to Vercel, connected to your GitHub repository.

### Prerequisites

- A GitHub account
- A Vercel account (free - sign up at [vercel.com](https://vercel.com))
- Your project code in a GitHub repository

### Step 1: Push Your Code to GitHub

If you haven't already pushed your code to GitHub:

1. Go to [GitHub](https://github.com) and create a new repository
2. Follow GitHub's instructions to push your local code to the repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### Step 2: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" (or "Log In" if you have an account)
3. Choose "Continue with GitHub" to link your GitHub account
4. Authorize Vercel to access your GitHub repositories

### Step 3: Import Your Project

1. Once logged in to Vercel, click the "Add New..." button in the top right
2. Select "Project" from the dropdown
3. You'll see a list of your GitHub repositories
4. Find your IF Ultimate Calc repository and click "Import"

### Step 4: Configure Your Project

1. **Project Name**: Vercel will suggest a project name (you can change it)
2. **Framework Preset**: Vercel should auto-detect "Vite" - if not, select it manually
3. **Root Directory**: Leave as `./` (default)
4. **Build Command**: Should be `npm run build` (auto-detected)
5. **Output Directory**: Should be `dist` (auto-detected)
6. **Environment Variables**: None required for this project

### Step 5: Deploy

1. Click the "Deploy" button
2. Vercel will now:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Deploy to a production URL

3. Wait 1-2 minutes for the deployment to complete

### Step 6: Access Your Deployed App

1. Once deployment succeeds, you'll see a success screen
2. Click "Visit" or the provided URL (e.g., `your-project.vercel.app`)
3. Your IF Ultimate Calc is now live! 🎉

### Step 7: Automatic Deployments

From now on:
- Every push to your `main` branch will automatically trigger a new deployment
- You can view deployment history and logs in your Vercel dashboard
- Each commit creates a unique preview URL for testing

### Custom Domain (Optional)

To use your own domain:

1. Go to your project dashboard on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to update your domain's DNS settings

### Troubleshooting

**Build Fails:**
- Check the build logs in Vercel dashboard
- Ensure `package.json` has all required dependencies
- Verify the build works locally with `npm run build`

**404 Errors:**
- Vite projects should work out of the box with Vercel
- If issues persist, add a `vercel.json` file:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**METAR API Issues:**
- The METAR API (metar.vatsim.net) should work from Vercel's servers
- If CORS issues occur, they're typically browser-side, not deployment-related

## Usage Guide

1. **Select Aircraft**: Choose from the categorized dropdown (Airbus, Boeing, Regional, GA, Military)
2. **Enter Airports**: Input ICAO codes for departure and arrival
3. **Set Weight**: Adjust aircraft weight in KG or LBS using the slider or input
4. **Fetch METAR**: Enter airport ICAO and click "Fetch METAR" for real-time weather
5. **Analyze Runways**: Enter available runways (e.g., "09L, 27R") for wind analysis
6. **Select Mode**: Choose "Takeoff" or "Landing" tab
7. **Configure Flaps**: Select appropriate flap setting
8. **View Speeds**: Calculated speeds (V1, VR, V2 or VREF, VAPP) display automatically

## Speed Calculation Logic

### Takeoff Speeds
- **Weight Ratio** = (Current Weight - Empty Weight) / (Max Weight - Empty Weight)
- **VR** = Base VR + ((Max VR - Base VR) × Weight Ratio) × Flap Factor
- **V1** = VR - 5 knots
- **V2** = VR + 10 knots

### Landing Speeds
- **VREF** = Base Ref + ((Max Ref - Base Ref) × Weight Ratio) × Flap Factor
- **VAPP** = VREF + Wind Correction (limited between 5-20 knots)
- **Wind Correction** = (Headwind / 2) + 5

## Contributing

Feel free to submit issues or pull requests to improve the aircraft database or calculation accuracy.

## License

This project is open source and available for the Infinite Flight community.

## Credits

Created for the Infinite Flight simulator community. Weather data provided by VATSIM METAR service.
