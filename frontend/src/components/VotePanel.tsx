import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MBTI_TYPES, ENNEAGRAM_TYPES, SUBTYPES, YI_HEXAGRAMS } from '../lib/types';
import { Vote, Loader2 } from 'lucide-react';

interface VotePanelProps {
  characterId: string;
  onVoteSubmit: () => void;
}

export const VotePanel: React.FC<VotePanelProps> = ({ characterId, onVoteSubmit }) => {
  const { user } = useAuth();
  const [mbti, setMbti] = useState<string>('');
  const [enneagram, setEnneagram] = useState<string>('');
  const [subtype, setSubtype] = useState<string>('');
  const [yiHexagram, setYiHexagram] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (user && characterId) {
      fetchExistingVote();
    }
  }, [user, characterId]);

  const fetchExistingVote = async () => {
    try {
      const { data, error } = await supabase
        .from('personality_votes')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', user!.id)
        .single();

      if (data && !error) {
        setMbti(data.mbti || '');
        setEnneagram(data.enneagram || '');
        setSubtype(data.subtype || '');
        setYiHexagram(data.yi_hexagram || '');
        setHasVoted(true);
      }
    } catch (error) {
      // No existing vote
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const voteData = {
        character_id: characterId,
        user_id: user!.id,
        mbti: mbti || null,
        enneagram: enneagram || null,
        subtype: subtype || null,
        yi_hexagram: yiHexagram || null
      };

      if (hasVoted) {
        const { error } = await supabase
          .from('personality_votes')
          .update(voteData)
          .eq('character_id', characterId)
          .eq('user_id', user!.id);

        if (error) throw error;
        setMessage('Vote updated successfully!');
      } else {
        const { error } = await supabase
          .from('personality_votes')
          .insert([voteData]);

        if (error) throw error;
        setMessage('Vote submitted successfully!');
        setHasVoted(true);
      }

      onVoteSubmit();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-eva-surface border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Vote className="w-5 h-5 text-eva-secondary" />
        {hasVoted ? 'Update Your Vote' : 'Cast Your Vote'}
      </h2>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm ${
          message.includes('Error') 
            ? 'bg-red-500/10 border border-red-500/50 text-red-400' 
            : 'bg-green-500/10 border border-green-500/50 text-green-400'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* MBTI */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">MBTI Type</label>
          <select
            value={mbti}
            onChange={(e) => setMbti(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
          >
            <option value="">Select MBTI</option>
            {MBTI_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Enneagram */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Enneagram (with wing)</label>
          <select
            value={enneagram}
            onChange={(e) => setEnneagram(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
          >
            <option value="">Select Enneagram</option>
            {ENNEAGRAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Subtype */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Subtype</label>
          <select
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
          >
            <option value="">Select Subtype</option>
            {SUBTYPES.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Yi Hexagram */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">易学六十四卦</label>
          <select
            value={yiHexagram}
            onChange={(e) => setYiHexagram(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-eva-secondary"
          >
            <option value="">选择卦象</option>
            {YI_HEXAGRAMS.map((hex) => (
              <option key={hex.id} value={`${hex.name_cn}${hex.symbol}`}>
                {hex.symbol} {hex.name_cn} - {hex.type}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || (!mbti && !enneagram && !subtype && !yiHexagram)}
          className="w-full bg-eva-secondary text-eva-bg font-bold py-3 rounded-lg hover:bg-eva-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Submitting...' : (hasVoted ? 'Update Vote' : 'Submit Vote')}
        </button>

        <p className="text-xs text-gray-500 text-center">
          You can vote for one or multiple personality types
        </p>
      </form>
    </div>
  );
};

