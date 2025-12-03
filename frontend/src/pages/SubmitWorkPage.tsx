import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkWorkDuplicate, scrapeWork } from '../lib/api';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';

export const SubmitWorkPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [workName, setWorkName] = useState('');
  const [workType, setWorkType] = useState<'anime' | 'manga' | 'game' | 'novel'>('anime');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName.trim()) return;

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      // Step 1: LLM 消歧检查（调用 Supabase Edge Function）
      const duplicateCheck = await checkWorkDuplicate(workName);

      if (duplicateCheck.isDuplicate && duplicateCheck.confidence > 0.8) {
        setError(
          `This work appears to be a duplicate: ${duplicateCheck.reason}. Matched work ID: ${duplicateCheck.matchedWorkId}`
        );
        setStep('input');
        setLoading(false);
        return;
      }

      // Step 3: Create work entry
      const { data: newWork, error: insertError } = await supabase
        .from('works')
        .insert([
          {
            name_cn: workName,
            type: workType,
            created_by: user!.id
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setResult(newWork);
      setStep('result');

      // Step 4: 触发 Firecrawl 爬取（异步，不等待完成）
      scrapeWork(newWork.id, workName).catch((err) => {
        console.error('Scrape work error:', err);
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-2">Submit New Work</h1>
      <p className="text-gray-400 mb-8">
        Add an ACGN work to the database. Our system will automatically fetch information and characters.
      </p>

      {step === 'input' && (
        <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Work Name (任意语言)
              </label>
              <input
                type="text"
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                placeholder="e.g., 新世纪エヴァンゲリオン / Evangelion / 新世纪福音战士"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-eva-secondary"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter the work name in any language. Our AI will check for duplicates.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Work Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['anime', 'manga', 'game', 'novel'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWorkType(type)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      workType === type
                        ? 'bg-eva-secondary text-eva-bg'
                        : 'bg-black/30 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-bold text-blue-400 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>AI checks for duplicate entries</li>
                <li>System fetches info from 萌娘百科, Wikipedia, and 百度百科</li>
                <li>Characters are automatically extracted</li>
                <li>You can start voting on personality types!</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !workName.trim()}
              className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Submit Work
            </button>
          </form>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-eva-surface border border-white/10 rounded-xl p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-eva-secondary mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Processing...</h2>
          <p className="text-gray-400">
            Checking for duplicates and preparing to fetch data...
          </p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="bg-eva-surface border border-white/10 rounded-xl p-8">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Work Submitted Successfully!</h2>
            <p className="text-gray-400">
              The system is now fetching character data. This may take a few minutes.
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg mb-2">{result.name_cn}</h3>
            <p className="text-sm text-gray-400">Type: {result.type}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/works/${result.id}`)}
              className="flex-1 bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors"
            >
              View Work Page
            </button>
            <button
              onClick={() => {
                setStep('input');
                setWorkName('');
                setResult(null);
              }}
              className="flex-1 bg-white/5 border border-white/10 text-white font-medium py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Submit Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

