// Fix for useEffect dependency issue - Line 118
// Move the filterReviews function outside of the component or use useCallback

import React, { useState, useEffect, useCallback } from 'react';
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
        let fileContent;
        
        // In production, import the CSV directly or fetch it from a public URL
        if (process.env.NODE_ENV === 'production') {
          // Option 1: If you can import the CSV file directly
          // Add the CSV file to your public folder and fetch it
          fileContent = await fetch('/data/reviews.csv')
            .then(response => response.text());
        } else {
          // In development, use the window.fs method if available
          fileContent = await window.fs.readFile('20250225_google_reviews_export copy.csv', { encoding: 'utf8' });
        }
        
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

  // Use useCallback to memoize the filterReviews function
  const filterReviews = useCallback(() => {
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
  }, [searchTerm, sortField, sortDirection, dateRange, ratingFilter, wordCategory, reviews, wordFrequencies]);

  useEffect(() => {
    filterReviews();
  }, [filterReviews]);

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

  // Remove the unused renderStarRating function
  
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

      {/* Filters Row */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <Filter style={{ color: KOALA_COLORS.teal }} className="mr-2" size={18} />
            <span style={{ color: KOALA_COLORS.darkBlue }} className="font-medium mr-3">Filters:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                style={getWordCategoryClass('All')}
                onClick={() => setWordCategory('All')}
              >
                All
              </button>
              <button 
                style={getWordCategoryClass('Quality')}
                onClick={() => setWordCategory('Quality')}
              >
                Quality
              </button>
              <button 
                style={getWordCategoryClass('Service')}
                onClick={() => setWordCategory('Service')}
              >
                Service
              </button>
              <button 
                style={getWordCategoryClass('Technical')}
                onClick={() => setWordCategory('Technical')}
              >
                Technical
              </button>
              <button 
                style={getWordCategoryClass('Performance')}
                onClick={() => setWordCategory('Performance')}
              >
                Performance
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Calendar style={{ color: KOALA_COLORS.teal }} className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: KOALA_COLORS.teal + '50' }}
                onChange={handleDateRangeChange}
                defaultValue="all"
              >
                {getDateRangeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Star style={{ color: KOALA_COLORS.teal }} className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                style={{ borderColor: KOALA_COLORS.teal + '50' }}
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="All">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            
            <div className="relative">
              <Search style={{ color: KOALA_COLORS.teal }} className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
              <input
                type="text"
                placeholder="Search reviews..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-64"
                style={{ borderColor: KOALA_COLORS.teal + '50' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4" style={{ borderTop: `3px solid ${KOALA_COLORS.blue}` }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${KOALA_COLORS.blue}20` }}>
              <Star style={{ color: KOALA_COLORS.blue }} size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <p className="text-2xl font-bold" style={{ color: KOALA_COLORS.darkBlue }}>{stats.averageRating}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4" style={{ borderTop: `3px solid ${KOALA_COLORS.green}` }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${KOALA_COLORS.green}20` }}>
              <HelpCircle style={{ color: KOALA_COLORS.green }} size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold" style={{ color: KOALA_COLORS.darkBlue }}>{stats.totalReviews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4" style={{ borderTop: `3px solid ${KOALA_COLORS.teal}` }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${KOALA_COLORS.teal}20` }}>
              <Star style={{ color: KOALA_COLORS.teal }} size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">5-Star Reviews</p>
              <p className="text-2xl font-bold" style={{ color: KOALA_COLORS.darkBlue }}>
                {stats.fiveStarCount} 
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({stats.totalReviews ? Math.round((stats.fiveStarCount / stats.totalReviews) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4" style={{ borderTop: `3px solid ${KOALA_COLORS.darkBlue}` }}>
          <div className="flex items-center">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${KOALA_COLORS.darkBlue}15` }}>
              <Star style={{ color: KOALA_COLORS.darkBlue }} size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Critical Reviews</p>
              <p className="text-2xl font-bold" style={{ color: KOALA_COLORS.darkBlue }}>
                {stats.oneStarCount + stats.twoStarCount}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({stats.totalReviews ? Math.round(((stats.oneStarCount + stats.twoStarCount) / stats.totalReviews) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Word Frequency */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2" style={{ borderLeft: `4px solid ${KOALA_COLORS.green}` }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: KOALA_COLORS.darkBlue }}>Word Frequency Analysis</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={wordFrequencies}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
                <XAxis type="number" tick={{ fill: '#6B7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="word" 
                  width={80}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} mentions`, 'Frequency']} 
                  contentStyle={{ borderColor: KOALA_COLORS.teal, backgroundColor: 'white' }}
                />
                <Bar dataKey="count" fill={KOALA_COLORS.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow p-4" style={{ borderLeft: `4px solid ${KOALA_COLORS.blue}` }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: KOALA_COLORS.darkBlue }}>Rating Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} reviews`, '']} 
                  contentStyle={{ borderColor: KOALA_COLORS.teal, backgroundColor: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: KOALA_COLORS.lightGreen, backgroundColor: KOALA_COLORS.lightGreen + '30' }}>
          <h2 className="text-xl font-bold" style={{ color: KOALA_COLORS.darkBlue }}>All Reviews</h2>
          <p className="text-gray-600">Showing {filteredReviews.length} of {reviews.length} reviews</p>
        </div>
        
        {/* Table Header */}
        <div className="flex bg-gray-100 p-4 font-medium" style={{ color: KOALA_COLORS.darkBlue, backgroundColor: KOALA_COLORS.lightBlue + '30' }}>
          <div className="w-36" onClick={() => handleSort('Date')}>
            <button className="flex items-center">
              Date
              <ArrowUpDown size={14} className="ml-1" style={{ color: KOALA_COLORS.blue }} />
            </button>
          </div>
          <div className="w-32" onClick={() => handleSort('Rating')}>
            <button className="flex items-center">
              Rating
              <ArrowUpDown size={14} className="ml-1" style={{ color: KOALA_COLORS.blue }} />
            </button>
          </div>
          <div className="w-48" onClick={() => handleSort('Reviewer')}>
            <button className="flex items-center">
              Reviewer
              <ArrowUpDown size={14} className="ml-1" style={{ color: KOALA_COLORS.blue }} />
            </button>
          </div>
          <div className="flex-1">Review</div>
        </div>
        
        {/* Table Body */}
        <div className="overflow-y-auto max-h-96">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No reviews match your filters
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <div 
                key={index}
                className="flex p-4 border-b border-gray-100 hover:bg-gray-50 review-row"
                style={{ 
                  borderColor: '#f3f4f6',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : KOALA_COLORS.lightGreen + '10' 
                }}
              >
                <div className="w-36 text-gray-600">{review.date}</div>
                <div className="w-32 star-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-2xl ${i < review.ratingNum ? '' : 'text-gray-300'}`}
                      style={i < review.ratingNum ? { color: KOALA_COLORS.green } : {}}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="w-48 font-medium" style={{ color: KOALA_COLORS.darkBlue }}>
                  {review.Reviewer || 'Anonymous'}
                </div>
                <div className="flex-1 text-gray-700">
                  {review["Review Text"] || <span className="italic text-gray-400">No review text provided</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="mt-8 p-4 text-center" style={{ color: KOALA_COLORS.darkBlue }}>
        <p>© {new Date().getFullYear()} Koala Insulation - All Rights Reserved</p>
        <div className="flex justify-center mt-2">
          <a href="https://www.koalainsulation.com/privacy-policy" className="mx-2" style={{ color: KOALA_COLORS.blue }}>Privacy Policy</a>
          <a href="https://www.koalainsulation.com/terms" className="mx-2" style={{ color: KOALA_COLORS.blue }}>Terms of Service</a>
          <a href="https://www.koalainsulation.com/contact" className="mx-2" style={{ color: KOALA_COLORS.blue }}>Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default ReviewDashboard;
