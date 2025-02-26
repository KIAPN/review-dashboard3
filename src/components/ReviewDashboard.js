import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Search, Star, Filter, ArrowUpDown, Calendar, HelpCircle } from 'lucide-react';
import Papa from 'papaparse';
import reviewsData from '../data/reviews.csv';

// Move wordCategories outside the component so it doesn't get recreated on each render
const WORD_CATEGORIES = {
  Quality: ['professional', 'excellent', 'quality', 'great', 'thorough'],
  Service: ['helpful', 'courteous', 'responsive', 'service', 'friendly'],
  Technical: ['attic', 'foam', 'efficient'],
  Performance: ['temperature', 'comfort', 'energy', 'cooling', 'heating'],
};

// Words to exclude from word frequency chart
const EXCLUDED_WORDS = [
  'insulation', 'koala', 'work', 'team', 'installation', 'them', 'after', 
  'done', 'time', 'aldrick', 'mike', 'home', 'they', 'their', 'there', 
  'were', 'with', 'from', 'have', 'very', 'would', 'about', 'also'
];

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

  const calculateStats = useCallback((reviewData) => {
    const total = reviewData.length;
    if (total === 0) return;
    
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
  }, []);

  const calculateWordFrequencies = useCallback((reviewData) => {
    const text = reviewData.map(r => r["Review Text"] || "").join(' ').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);
    
    const wordCount = {};
    words.forEach(word => {
      // Remove punctuation and only count words with letters
      const cleanWord = word.replace(/[^\w\s]/gi, '');
      if (cleanWord && 
          cleanWord.length > 3 && 
          !EXCLUDED_WORDS.includes(cleanWord) && 
          /[a-zA-Z]/.test(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    // Convert to array and sort
    const wordFreqArray = Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    setWordFrequencies(wordFreqArray);
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        // Load CSV data
        fetch(reviewsData)
          .then(response => response.text())
          .then(csvText => {
            Papa.parse(csvText, {
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
          })
          .catch(error => {
            console.error('Error fetching CSV file:', error);
            setLoading(false);
          });
      } catch (error) {
        console.error('Error loading reviews:', error);
        setLoading(false);
      }
    };

    loadReviews();
  }, [calculateStats, calculateWordFrequencies]);

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
      const categoryWords = WORD_CATEGORIES[wordCategory];
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
      const categoryWords = WORD_CATEGORIES[wordCategory];
      const filteredFrequencies = wordFrequencies.filter(item => 
        categoryWords.includes(item.word)
      );
      setWordFrequencies(filteredFrequencies);
    }
  }, [reviews, searchTerm, sortField, sortDirection, dateRange, ratingFilter, wordCategory, calculateStats, calculateWordFrequencies, wordFrequencies]);

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
      ? 'bg-blue-600 text-white font-medium py-1 px-3 rounded-full mr-2'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded-full mr-2';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl">Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <header className="bg-white rounded-lg shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Koala Insulation Reviews Analysis</h1>
        <p className="text-gray-600">Analyze customer feedback and sentiment trends</p>
      </header>
      
      {/* Filters Row */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <Filter className="text-gray-400 mr-2" size={18} />
            <span className="text-gray-700 font-medium mr-3">Filters:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                className={getWordCategoryClass('All')}
                onClick={() => setWordCategory('All')}
              >
                All
              </button>
              <button 
                className={getWordCategoryClass('Quality')}
                onClick={() => setWordCategory('Quality')}
              >
                Quality
              </button>
              <button 
                className={getWordCategoryClass('Service')}
                onClick={() => setWordCategory('Service')}
              >
                Service
              </button>
              <button 
                className={getWordCategoryClass('Technical')}
                onClick={() => setWordCategory('Technical')}
              >
                Technical
              </button>
              <button 
                className={getWordCategoryClass('Performance')}
                onClick={() => setWordCategory('Performance')}
              >
                Performance
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
              <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search reviews..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Star className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800">{stats.averageRating}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <HelpCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalReviews}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">5-Star Reviews</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.fiveStarCount} 
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({stats.totalReviews ? Math.round((stats.fiveStarCount / stats.totalReviews) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <Star className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Critical Reviews</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.oneStarCount + stats.twoStarCount}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({stats.totalReviews ? Math.round(((stats.oneStarCount + stats.twoStarCount) / stats.totalReviews) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Word Frequency Chart - Now Full Width */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Word Frequency Analysis</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={wordFrequencies}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="word" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value) => [`${value} mentions`, 'Frequency']} />
              <Bar dataKey="count" fill="#4299e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">All Reviews</h2>
          <p className="text-gray-600">Showing {filteredReviews.length} of {reviews.length} reviews</p>
        </div>
        
        {/* Table Header */}
        <div className="flex bg-gray-100 p-4 font-medium text-gray-700">
          <div className="w-36" onClick={() => handleSort('Date')}>
            <button className="flex items-center">
              Date
              <ArrowUpDown size={14} className="ml-1" />
            </button>
          </div>
          <div className="w-32" onClick={() => handleSort('Rating')}>
            <button className="flex items-center">
              Rating
              <ArrowUpDown size={14} className="ml-1" />
            </button>
          </div>
          <div className="w-48" onClick={() => handleSort('Reviewer')}>
            <button className="flex items-center">
              Reviewer
              <ArrowUpDown size={14} className="ml-1" />
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
                className="flex p-4 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="w-36 text-gray-600">{review.date}</div>
                <div className="w-32">
                  {renderStarRating(review.ratingNum)}
                </div>
                <div className="w-48 font-medium text-gray-800">
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
    </div>
  );
};

export default ReviewDashboard;
