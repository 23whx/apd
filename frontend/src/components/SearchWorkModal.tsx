import React, { useState } from 'react';
import { X, Search, Loader2, AlertCircle, CheckCircle, Database, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SearchWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'input' | 'searching' | 'disambiguating' | 'scraping' | 'success' | 'duplicate';

export const SearchWorkModal: React.FC<SearchWorkModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!user) {
      setError('Please login first');
      return;
    }

    setError('');
    setStep('searching');

    try {
      // Step 1: 数据库模糊查询
      const searchResponse = await fetch('/api/search-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!searchResponse.ok) throw new Error('Search failed');
      const searchData = await searchResponse.json();

      if (searchData.found) {
        // 找到相似作品，需要用户确认或消歧
        setCandidates(searchData.candidates);
        setStep('disambiguating');
        
        // 调用 LLM 消歧
        const disambigResponse = await fetch('/api/disambiguate-work', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, candidates: searchData.candidates })
        });

        if (!disambigResponse.ok) throw new Error('Disambiguation failed');
        const disambigData = await disambigResponse.json();

        if (disambigData.isDuplicate && disambigData.confidence > 0.7) {
          setStep('duplicate');
          setError(`This work already exists: ${disambigData.reason}`);
          return;
        }
      }

      // Step 2: 确认是新作品，开始抓取
      setStep('scraping');
      const scrapeResponse = await fetch('/api/scrape-work-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workName: query, userId: user.id })
      });

      if (!scrapeResponse.ok) throw new Error('Scraping failed');
      const scrapeData = await scrapeResponse.json();

      setResult(scrapeData);
      setStep('success');

    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStep('input');
    }
  };

  const handleReset = () => {
    setQuery('');
    setStep('input');
    setError('');
    setCandidates([]);
    setResult(null);
  };

  const handleViewWork = () => {
    if (result && result.work) {
      navigate(`/works/${result.work.id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-eva-surface border border-white/10 rounded-xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-eva-secondary" />
          Search ACGN Work
        </h2>

        {error && step !== 'duplicate' && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Work Name (中/英/日 any language)
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., 新世纪エヴァンゲリオン / Evangelion"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                autoFocus
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                What happens next?
              </h3>
              <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                <li>Database fuzzy search for similar works</li>
                <li>AI disambiguation (DeepSeek) to avoid duplicates</li>
                <li>Auto-scrape from 萌娘百科, Wikipedia, 百度百科 (Firecrawl)</li>
                <li>Extract characters and create entries</li>
              </ol>
            </div>

            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search & Create
            </button>
          </div>
        )}

        {step === 'searching' && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-eva-secondary mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">Searching database...</p>
            <p className="text-sm text-gray-400 mt-2">Checking for similar works</p>
          </div>
        )}

        {step === 'disambiguating' && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-eva-accent mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">AI Disambiguation...</p>
            <p className="text-sm text-gray-400 mt-2">DeepSeek is checking if this is a duplicate</p>
            {candidates.length > 0 && (
              <div className="mt-4 text-left bg-white/5 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">Similar works found:</p>
                <ul className="text-sm space-y-1">
                  {candidates.map((c, i) => (
                    <li key={i} className="text-gray-400">
                      • {c.name_cn} ({c.name_en || 'N/A'}) - {c.type}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 'scraping' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-eva-secondary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Scraping wikis...</p>
            <p className="text-sm text-gray-400 mt-2">Fetching data from 萌娘百科, Wikipedia, 百度百科</p>
            <p className="text-xs text-gray-500 mt-4">This may take 10-30 seconds</p>
          </div>
        )}

        {step === 'duplicate' && (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-yellow-400">Duplicate Detected</p>
            <p className="text-sm text-gray-300 mt-2">{error}</p>
            {candidates.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Existing work:</p>
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(`/works/${c.id}`);
                      onClose();
                    }}
                    className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-left transition-colors"
                  >
                    <p className="font-medium">{c.name_cn}</p>
                    <p className="text-sm text-gray-400">{c.name_en || 'N/A'} • {c.type}</p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleReset}
              className="mt-4 text-sm text-eva-secondary hover:underline"
            >
              Search another work
            </button>
          </div>
        )}

        {step === 'success' && result && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-400">Work Created Successfully!</p>
            
            <div className="mt-4 bg-white/5 rounded-lg p-4 text-left">
              <h3 className="font-bold text-lg mb-2">{result.work.name_cn}</h3>
              <p className="text-sm text-gray-400">
                {result.work.name_en || 'N/A'} • {result.work.type}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {result.charactersCount} characters extracted
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Sources: {result.sources.join(', ')}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleViewWork}
                className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors"
              >
                View Work
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-white/5 border border-white/10 text-white font-medium py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Add Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

