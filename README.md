# Koala Insulation Review Dashboard

An interactive dashboard for analyzing Google Reviews data for Koala Insulation.

## Features

- Word frequency analysis with category filtering
- Star rating distribution visualization
- Interactive review table with sorting and filtering
- Sentiment analysis based on keywords
- Responsive design that works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/koala-reviews-dashboard.git
   cd koala-reviews-dashboard
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Place your reviews data file in the `src/data` directory
   - Rename your CSV file to `reviews.csv`
   - Make sure it has the correct columns: Review ID, Rating, Review Text, Date, Reviewer, etc.

4. Start the development server
   ```bash
   npm start
   ```

## Deployment

### Deploying to Netlify

1. Push your code to GitHub

2. Connect your GitHub repository to Netlify
   - Login to Netlify
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `build`
   - Click "Deploy site"

### Using Docker

To run the dashboard in a container:

1. Build the Docker image
   ```bash
   docker build -t koala-reviews-dashboard .
   ```

2. Run the container
   ```bash
   docker run -p 8080:80 koala-reviews-dashboard
   ```

3. Access the dashboard at http://localhost:8080

## Customization

### Modifying Word Categories

Edit the wordCategories object in `src/components/ReviewDashboard.js` to change the word categories for filtering:

```javascript
const wordCategories = {
  Quality: ['professional', 'excellent', 'quality', 'great', 'thorough'],
  Service: ['helpful', 'courteous', 'responsive', 'service', 'friendly'],
  Technical: ['insulation', 'attic', 'foam', 'efficient', 'installation'],
  Performance: ['temperature', 'comfort', 'energy', 'cooling', 'heating'],
};
```

### Styling

The dashboard uses Tailwind CSS for styling. You can modify the appearance by:

1. Editing the Tailwind configuration in `tailwind.config.js`
2. Adding custom styles in `src/index.css`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
