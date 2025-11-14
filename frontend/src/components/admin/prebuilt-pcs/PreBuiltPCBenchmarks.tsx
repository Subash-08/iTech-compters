// src/components/admin/prebuilt-pcs/PreBuiltPCBenchmarks.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Edit,
  Save,
  Plus,
  Trash2,
  BarChart3,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  preBuiltPCService, 
  type BenchmarkTest, 
  type PerformanceSummary 
} from '../services/preBuiltPCService';

interface PreBuiltPCBenchmarksProps {
  pcId?: string;
  currentPC?: any;
}

const PreBuiltPCBenchmarks: React.FC<PreBuiltPCBenchmarksProps> = ({ pcId, currentPC: propCurrentPC }) => {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use pcId from props or from URL params
  const actualId = pcId || urlId;
  
  const [loading, setLoading] = useState(!propCurrentPC);
  const [saving, setSaving] = useState(false);
  const [currentPC, setCurrentPC] = useState<any>(propCurrentPC || null);
  const [isEditing, setIsEditing] = useState(false);

  const [benchmarkTests, setBenchmarkTests] = useState<BenchmarkTest[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary>({
    gamingPerformance: 5,
    productivityPerformance: 5,
    thermalPerformance: 5,
    powerEfficiency: 5,
    overallRating: 5,
    strengths: [],
    limitations: [],
    recommendedUse: []
  });
  const [testNotes, setTestNotes] = useState('');
  const [testedBy, setTestedBy] = useState('');
  const [testDate, setTestDate] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [newLimitation, setNewLimitation] = useState('');

  const testCategories = ['Gaming', 'Synthetic', 'Productivity', 'Thermal', 'Power Consumption'];
  const recommendedUses = ['Gaming', 'Streaming', 'Video Editing', '3D Rendering', 'Programming', 'Office Work', 'Content Creation'];

  useEffect(() => {
    if (actualId && !propCurrentPC) {
      loadPreBuiltPC();
    } else if (propCurrentPC) {
      setCurrentPC(propCurrentPC);
      initializeBenchmarkData(propCurrentPC);
      setLoading(false);
    }
  }, [actualId, propCurrentPC]);

  const initializeBenchmarkData = (pc: any) => {
    setBenchmarkTests(pc.benchmarkTests || []);
    setPerformanceSummary(pc.performanceSummary || {
      gamingPerformance: 5,
      productivityPerformance: 5,
      thermalPerformance: 5,
      powerEfficiency: 5,
      overallRating: 5,
      strengths: [],
      limitations: [],
      recommendedUse: []
    });
    setTestNotes(pc.testNotes || '');
    setTestedBy(pc.testedBy || '');
    setTestDate(pc.testDate ? new Date(pc.testDate).toISOString().split('T')[0] : '');
  };

  const loadPreBuiltPC = async () => {
    if (!actualId) return;

    try {
      setLoading(true);
      const response = await preBuiltPCService.getPreBuiltPC(actualId);
      setCurrentPC(response.data);
      initializeBenchmarkData(response.data);
    } catch (error) {
      toast.error('Failed to load pre-built PC');
      console.error('Error loading pre-built PC:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBenchmarkTest = () => {
    setBenchmarkTests(prev => [...prev, {
      testName: '',
      testCategory: 'Gaming',
      score: 0,
      unit: 'Points',
      description: '',
      settings: {
        resolution: '1920x1080',
        quality: 'Ultra',
        otherSettings: ''
      },
      comparison: {
        betterThan: 50,
        averageScore: 0
      }
    }]);
  };

  const updateBenchmarkTest = (index: number, field: string, value: any) => {
    const updatedTests = [...benchmarkTests];
    
    if (field.startsWith('settings.')) {
      const settingField = field.split('.')[1];
      updatedTests[index] = {
        ...updatedTests[index],
        settings: {
          ...updatedTests[index].settings,
          [settingField]: value
        }
      };
    } else if (field.startsWith('comparison.')) {
      const comparisonField = field.split('.')[1];
      updatedTests[index] = {
        ...updatedTests[index],
        comparison: {
          ...updatedTests[index].comparison,
          [comparisonField]: value
        }
      };
    } else {
      updatedTests[index] = {
        ...updatedTests[index],
        [field]: value
      };
    }
    
    setBenchmarkTests(updatedTests);
  };

  const removeBenchmarkTest = (index: number) => {
    setBenchmarkTests(prev => prev.filter((_, i) => i !== index));
  };

  const updatePerformanceRating = (field: keyof PerformanceSummary, value: number) => {
    setPerformanceSummary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setPerformanceSummary(prev => ({
        ...prev,
        strengths: [...prev.strengths, newStrength.trim()]
      }));
      setNewStrength('');
    }
  };

  const removeStrength = (index: number) => {
    setPerformanceSummary(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== index)
    }));
  };

  const addLimitation = () => {
    if (newLimitation.trim()) {
      setPerformanceSummary(prev => ({
        ...prev,
        limitations: [...prev.limitations, newLimitation.trim()]
      }));
      setNewLimitation('');
    }
  };

  const removeLimitation = (index: number) => {
    setPerformanceSummary(prev => ({
      ...prev,
      limitations: prev.limitations.filter((_, i) => i !== index)
    }));
  };

  const toggleRecommendedUse = (use: string) => {
    setPerformanceSummary(prev => ({
      ...prev,
      recommendedUse: prev.recommendedUse.includes(use)
        ? prev.recommendedUse.filter(u => u !== use)
        : [...prev.recommendedUse, use]
    }));
  };

  const calculateOverallRating = () => {
    const { gamingPerformance, productivityPerformance, thermalPerformance, powerEfficiency } = performanceSummary;
    const average = (gamingPerformance + productivityPerformance + thermalPerformance + powerEfficiency) / 4;
    return Math.round(average * 2) / 2; // Round to nearest 0.5
  };

  const handleSaveBenchmarks = async () => {
    if (!actualId) return;

    try {
      setSaving(true);

      const finalPerformanceSummary = {
        ...performanceSummary,
        overallRating: calculateOverallRating()
      };

      const benchmarkData = {
        benchmarkTests,
        performanceSummary: finalPerformanceSummary,
        testNotes,
        testedBy,
        testDate: testDate || new Date().toISOString()
      };

      await preBuiltPCService.addBenchmarkTests(actualId, benchmarkData);
      toast.success('Benchmark tests saved successfully');
      setIsEditing(false);
      
      // Reload data if we're not getting updates from parent
      if (!propCurrentPC) {
        loadPreBuiltPC();
      }
    } catch (error: any) {
      toast.error('Failed to save benchmark tests');
      console.error('Error saving benchmarks:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!actualId || !testId) return;
    
    if (window.confirm('Are you sure you want to delete this benchmark test?')) {
      try {
        await preBuiltPCService.removeBenchmarkTest(actualId, testId);
        toast.success('Benchmark test deleted successfully');
        loadPreBuiltPC(); // Refresh the data
      } catch (error: any) {
        toast.error('Failed to delete benchmark test');
        console.error('Error deleting benchmark test:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentPC) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Pre-built PC not found</h3>
        <p className="text-gray-500 mt-2">The requested pre-built PC could not be loaded.</p>
        <Link
          to="/admin/prebuilt-pcs"
          className="mt-4 inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pre-built PCs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link to="/admin/prebuilt-pcs" className="hover:text-gray-700">
                Pre-built PCs
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>{currentPC.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Benchmark Tests & Performance
            </h1>
            <p className="text-gray-600">
              Manage performance tests and benchmark results for {currentPC.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to={`/admin/prebuilt-pcs/edit/${actualId}`}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit PC</span>
            </Link>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Benchmarks</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBenchmarks}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - PC Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* PC Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PC Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{currentPC.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900">{currentPC.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Performance Rating</label>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(currentPC.performanceRating / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currentPC.performanceRating}/10
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentPC.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {currentPC.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            {currentPC.isTested ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gaming</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(performanceSummary.gamingPerformance / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceSummary.gamingPerformance}/10
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Productivity</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${(performanceSummary.productivityPerformance / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceSummary.productivityPerformance}/10
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Thermal</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${(performanceSummary.thermalPerformance / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceSummary.thermalPerformance}/10
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Power Efficiency</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(performanceSummary.powerEfficiency / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {performanceSummary.powerEfficiency}/10
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Overall Rating</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-yellow-600 h-3 rounded-full" 
                        style={{ width: `${(performanceSummary.overallRating / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {performanceSummary.overallRating}/10
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No benchmark tests available</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Add benchmark tests
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Benchmark Tests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benchmark Tests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Benchmark Tests</h3>
              {isEditing && (
                <button
                  onClick={addBenchmarkTest}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Test</span>
                </button>
              )}
            </div>

            {benchmarkTests.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No benchmark tests added yet</p>
                {isEditing && (
                  <button
                    onClick={addBenchmarkTest}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Add your first benchmark test
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {benchmarkTests.map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={test.testName}
                            onChange={(e) => updateBenchmarkTest(index, 'testName', e.target.value)}
                            placeholder="Test Name"
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          test.testName
                        )}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <button
                            onClick={() => removeBenchmarkTest(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          test._id && (
                            <button
                              onClick={() => handleDeleteTest(test._id!)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Category</label>
                        {isEditing ? (
                          <select
                            value={test.testCategory}
                            onChange={(e) => updateBenchmarkTest(index, 'testCategory', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                          >
                            {testCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900">{test.testCategory}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-500">Score</label>
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={test.score}
                              onChange={(e) => updateBenchmarkTest(index, 'score', parseFloat(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                            <input
                              type="text"
                              value={test.unit}
                              onChange={(e) => updateBenchmarkTest(index, 'unit', e.target.value)}
                              placeholder="Unit"
                              className="w-24 border border-gray-300 rounded px-2 py-1"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-900">{test.score} {test.unit}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-gray-500">Description</label>
                        {isEditing ? (
                          <textarea
                            value={test.description}
                            onChange={(e) => updateBenchmarkTest(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-900">{test.description}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-500">Better Than</label>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={test.comparison.betterThan}
                              onChange={(e) => updateBenchmarkTest(index, 'comparison.betterThan', parseInt(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-sm w-12">{test.comparison.betterThan}%</span>
                          </div>
                        ) : (
                          <p className="text-gray-900">{test.comparison.betterThan}% of similar builds</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Details (Editing Mode) */}
          {isEditing && (
            <>
              {/* Performance Ratings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'gamingPerformance', label: 'Gaming Performance', color: 'blue' },
                    { key: 'productivityPerformance', label: 'Productivity Performance', color: 'purple' },
                    { key: 'thermalPerformance', label: 'Thermal Performance', color: 'orange' },
                    { key: 'powerEfficiency', label: 'Power Efficiency', color: 'green' }
                  ].map(({ key, label, color }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={performanceSummary[key as keyof PerformanceSummary] as number}
                          onChange={(e) => updatePerformanceRating(key as keyof PerformanceSummary, parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-sm font-medium text-gray-900 w-8">
                          {performanceSummary[key as keyof PerformanceSummary] as number}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Limitations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths & Limitations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strengths
                    </label>
                    <div className="space-y-2">
                      {performanceSummary.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                          <span className="text-sm text-green-800">{strength}</span>
                          <button
                            type="button"
                            onClick={() => removeStrength(index)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newStrength}
                          onChange={(e) => setNewStrength(e.target.value)}
                          placeholder="Add strength..."
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addStrength}
                          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limitations
                    </label>
                    <div className="space-y-2">
                      {performanceSummary.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center justify-between bg-red-50 px-3 py-2 rounded">
                          <span className="text-sm text-red-800">{limitation}</span>
                          <button
                            type="button"
                            onClick={() => removeLimitation(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newLimitation}
                          onChange={(e) => setNewLimitation(e.target.value)}
                          placeholder="Add limitation..."
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addLimitation}
                          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Use & Test Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommended Use
                    </label>
                    <div className="space-y-2">
                      {recommendedUses.map(use => (
                        <label key={use} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={performanceSummary.recommendedUse.includes(use)}
                            onChange={() => toggleRecommendedUse(use)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{use}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tested By
                      </label>
                      <input
                        type="text"
                        value={testedBy}
                        onChange={(e) => setTestedBy(e.target.value)}
                        placeholder="Tester name"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Date
                      </label>
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Notes
                  </label>
                  <textarea
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                    placeholder="Additional notes about the testing process..."
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCBenchmarks;