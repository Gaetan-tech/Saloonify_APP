import { useState } from 'react';
import { useMutation } from '@apollo/client';
import StarRating from './StarRating';
import { ADD_REVIEW } from '../graphql/mutations';
import { GET_REVIEWS } from '../graphql/queries';

interface ReviewFormProps {
  salonId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ salonId, onSuccess }: ReviewFormProps) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [addReview, { loading, error }] = useMutation(ADD_REVIEW, {
    refetchQueries: [{ query: GET_REVIEWS, variables: { salonId, limit: 20, offset: 0 } }],
    onCompleted: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note === 0) return;
    await addReview({ variables: { salonId, note, commentaire: commentaire || undefined } });
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🌟</p>
        <p className="font-semibold text-dark">Merci pour votre avis !</p>
        <p className="text-gray-500 text-sm mt-1">Votre avis aide d'autres clients à choisir.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark mb-2">Votre note *</label>
        <StarRating note={note} size="lg" interactive onChange={setNote} />
      </div>

      <div>
        <label htmlFor="commentaire" className="block text-sm font-medium text-dark mb-2">
          Commentaire (optionnel)
        </label>
        <textarea
          id="commentaire"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Décrivez votre expérience..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{commentaire.length}/500</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error.message}</p>}

      <button
        type="submit"
        disabled={note === 0 || loading}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Envoi...' : 'Publier mon avis'}
      </button>
    </form>
  );
}
