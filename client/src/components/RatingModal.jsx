import React, { useState } from 'react';
import axios from 'axios';

export default function RatingModal({ rideId, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/rate`, {
        rideId,
        rating: Number(rating),
        comment: comment?.trim() || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onClose(true);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center">
      <div className="w-full md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Rate your ride</h3>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="flex items-center gap-2 my-2">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
              aria-label={`Rate ${star}`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
        </div>
        <textarea
          className="w-full border rounded-lg p-2 text-sm"
          rows={3}
          placeholder="Share your feedback (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        <button
          disabled={submitting}
          onClick={submitRating}
          className="mt-3 w-full py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
