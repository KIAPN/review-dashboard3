import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Search, Star, Filter, ArrowUpDown, Calendar, HelpCircle } from 'lucide-react';
import Papa from 'papaparse';

// Koala brand colors from the brand guide
const KOALA_COLORS = {
  green: '#95C93D',      // Primary green
  teal: '#7EB4A3',       // Teal accent
  blue: '#73AADC',       // Light blue
  darkBlue: '#043968',   // Dark blue
  lightGreen: '#e9f5d3', // Light green for backgrounds
  lightTeal: '#e3f0eb',  // Light teal for backgrounds
  lightBlue: '#e2eef8'   // Light blue for backgrounds
};

const ReviewDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [wordFrequencies, setWordFrequencies] = useState([]);
  const [wordCategory, setWordCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('Date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [ratingFilter, setRatingFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
  });

  const wordCategories = {
    Quality: ['professional', 'excellent', 'quality', 'great', 'thorough'],
    Service: ['helpful', 'courteous', 'responsive', 'service', 'friendly'],
    Technical: ['insulation', 'attic', 'foam', 'efficient', 'installation'],
    Performance: ['temperature', 'comfort', 'energy', 'cooling', 'heating'],
  };

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const fileContent = await window.fs.readFile('20250225_google_reviews_export copy.csv', { encoding: 'utf8' });
        
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedReviews = results.data.map(review => {
              // Convert rating text to number
              let ratingNum = 5;
              if (review.Rating === 'ONE') ratingNum = 1;
              if (review.Rating === 'TWO') ratingNum = 2;
              if (review.Rating === 'THREE') ratingNum = 3;
              if (review.Rating === 'FOUR') ratingNum = 4;
              if (review.Rating === 'FIVE') ratingNum = 5;
              
              // Parse date
              const date = new Date(review.Date);
              const formattedDate = date.toISOString().split('T')[0];
              
              return {
                ...review,
                ratingNum,
                date: formattedDate,
              };
            });
            
            // Sort by date (most recent first)
            const sortedReviews = parsedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setReviews(sortedReviews);
            setFilteredReviews(sortedReviews);
            calculateStats(sortedReviews);
            calculateWordFrequencies(sortedReviews);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error reading file:', error);
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [searchTerm, sortField, sortDirection, dateRange, ratingFilter, wordCategory, reviews]);

  const calculateStats = (reviewData) => {
    const total = reviewData.length;
    const fiveStar = reviewData.filter(r => r.ratingNum === 5).length;
    const fourStar = reviewData.filter(r => r.ratingNum === 4).length;
    const threeStar = reviewData.filter(r => r.ratingNum === 3).length;
    const twoStar = reviewData.filter(r => r.ratingNum === 2).length;
    const oneStar = reviewData.filter(r => r.ratingNum === 1).length;
    
    const avgRating = reviewData.reduce((sum, r) => sum + r.ratingNum, 0) / total;
    
    setStats({
      averageRating: avgRating.toFixed(1),
      totalReviews: total,
      fiveStarCount: fiveStar,
      fourStarCount: fourStar,
      threeStarCount: threeStar,
      twoStarCount: twoStar,
      oneStarCount: oneStar,
    });
  };

  const calculateWordFrequencies = (reviewData) => {
    const text = reviewData.map(r => r["Review Text"]).join(' ').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);
    
    const stopWords = ['this', 'that', 'they', 'their', 'there', 'were', 'with', 'from', 'have', 'very', 'would', 'about', 'also'];
    
    const wordCount = {};
    words.forEach(word => {
      // Remove punctuation and only count words with letters
      const cleanWord = word.replace(/[^\w\s]/gi, '');
      if (cleanWord && cleanWord.length > 3 && !stopWords.includes(cleanWord) && /[a-zA-Z]/.test(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const wordFreqArray = Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    setWordFrequencies(wordFreqArray);
  };

  const filterReviews = () => {
    let filtered = [...reviews];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(review => 
        (review["Review Text"] && review["Review Text"].toLowerCase().includes(term)) ||
        (review.Reviewer && review.Reviewer.toLowerCase().includes(term))
      );
    }
    
    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(review => review.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(review => review.date <= dateRange.end);
    }
    
    // Apply rating filter
    if (ratingFilter !== 'All') {
      const ratingValue = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.ratingNum === ratingValue);
    }
    
    // Apply word category filter
    if (wordCategory !== 'All') {
      const categoryWords = wordCategories[wordCategory];
      filtered = filtered.filter(review => {
        if (!review["Review Text"]) return false;
        const reviewText = review["Review Text"].toLowerCase();
        return categoryWords.some(word => reviewText.includes(word));
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === 'Date') {
        return sortDirection === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      } else if (sortField === 'Rating') {
        return sortDirection === 'asc'
          ? a.ratingNum - b.ratingNum
          : b.ratingNum - a.ratingNum;
      } else if (sortField === 'Reviewer') {
        const nameA = (a.Reviewer || '').toUpperCase();
        const nameB = (b.Reviewer || '').toUpperCase();
        return sortDirection === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      return 0;
    });
    
    setFilteredReviews(filtered);
    
    // Recalculate stats for filtered reviews
    calculateStats(filtered);
    
    // If word category changed, don't recalculate word frequencies
    if (wordCategory === 'All') {
      calculateWordFrequencies(filtered);
    } else {
      // Filter word frequencies by category
      const categoryWords = wordCategories[wordCategory];
      const filteredFrequencies = wordFrequencies.filter(item => 
        categoryWords.includes(item.word)
      );
      setWordFrequencies(filteredFrequencies);
    }
  };

  const handleSort = (field) => {
    setSortDirection(sortField === field && sortDirection === 'desc' ? 'asc' : 'desc');
    setSortField(field);
  };

  const getDateRangeOptions = () => {
    const options = [
      { label: 'All Time', value: 'all' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days', value: '90' },
      { label: 'Last Year', value: '365' },
    ];
    
    return options;
  };

  const handleDateRangeChange = (e) => {
    const days = e.target.value;
    
    if (days === 'all') {
      setDateRange({ start: null, end: null });
      return;
    }
    
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    const startStr = start.toISOString().split('T')[0];
    
    setDateRange({ start: startStr, end });
  };

  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const getWordCategoryClass = (category) => {
    return wordCategory === category
      ? { backgroundColor: KOALA_COLORS.green, color: 'white', fontWeight: '500', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginRight: '0.5rem' }
      : { backgroundColor: '#e5e7eb', color: '#1f2937', fontWeight: '500', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginRight: '0.5rem' };
  };

  const getPieChartData = () => [
    { name: '5 Stars', value: stats.fiveStarCount },
    { name: '4 Stars', value: stats.fourStarCount },
    { name: '3 Stars', value: stats.threeStarCount },
    { name: '2 Stars', value: stats.twoStarCount },
    { name: '1 Star', value: stats.oneStarCount },
  ];

  // Using Koala colors for the pie chart
  const pieColors = [
    KOALA_COLORS.green, 
    KOALA_COLORS.teal, 
    KOALA_COLORS.blue, 
    KOALA_COLORS.lightTeal, 
    KOALA_COLORS.lightBlue
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto" 
            style={{ borderColor: KOALA_COLORS.green }}
          ></div>
          <p className="mt-4 text-xl" style={{ color: KOALA_COLORS.darkBlue }}>Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen" style={{ background: `linear-gradient(to bottom right, ${KOALA_COLORS.lightGreen}30, ${KOALA_COLORS.lightBlue}30)` }}>
      <header 
        className="rounded-lg shadow p-4 mb-6 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(to right, ${KOALA_COLORS.lightGreen}, ${KOALA_COLORS.lightBlue})`,
          borderBottom: `3px solid ${KOALA_COLORS.green}`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl font-bold"
              style={{ color: KOALA_COLORS.darkBlue }}
            >
              Koala Insulation Reviews Analysis
            </h1>
            <p className="text-gray-600">Analyze customer feedback and sentiment trends</p>
          </div>
          <div className="w-48">
            {/* Koala Logo SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">
              <path d="M96.78 18.53c3.58-.55 5.31-2.66 7.53-5.39 2.4-2.94 5.6-6.88 11.57-6.88 4.83 0 8.2 2.86 9.75 5.39 1.5 2.45 1.43 4.79.91 6.69-.63 2.3-2.27 4.5-4.76 6.44-4.07 3.16-9.6 5.02-14.63 5.02-2.6 0-4.97-.5-6.86-1.5-1.88-1-3.27-2.49-3.87-4.42-.3-.96-.35-1.97-.14-2.98.2-1.01.65-2.02 1.33-2.93l-.83.56z" style={{ fill: KOALA_COLORS.green }}></path>
            </svg>
          </div>
        </div>
      </header>
