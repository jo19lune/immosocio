import React, { useState } from 'react';
import api from '../../lib/api';

interface Reaction {
  id: number;
  type: string;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface Commentaire {
  id: number;
  contenu: string;
  dateCreation: string;
  auteur: {
    id: number;
    nom: string;
    prenom: string;
    photoProfil?: string;
  };
  reponses?: Commentaire[];
  reactions?: Reaction[];
}

interface CommentItemProps {
  comment: Commentaire;
  publicationId: number;
  onReplyAdded: () => void;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, publicationId, onReplyAdded, depth = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group reactions by type
  const reactionsCount = comment.reactions?.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/commentaires/${comment.id}/reponses`, { contenu: replyContent });
      setReplyContent('');
      setIsReplying(false);
      onReplyAdded();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (type: string) => {
    try {
      await api.post(`/commentaires/${comment.id}/reactions`, { type });
      onReplyAdded(); // to refresh reactions
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'mt-3' : 'mt-4'}`}>
      <img
        src={comment.auteur.photoProfil || `https://ui-avatars.com/api/?name=${comment.auteur.prenom}+${comment.auteur.nom}&background=random`}
        alt={`${comment.auteur.prenom} ${comment.auteur.nom}`}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 inline-block max-w-full">
          <div className="font-semibold text-sm text-gray-900 dark:text-white">
            {comment.auteur.prenom} {comment.auteur.nom}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.contenu}</p>
        </div>
        
        <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-gray-500">
          <span>{formatDate(comment.dateCreation)}</span>
          <button onClick={() => handleReaction('LIKE')} className="hover:text-primary transition-colors font-medium">
            J'aime
          </button>
          <button onClick={() => setIsReplying(!isReplying)} className="hover:text-primary transition-colors font-medium">
            Répondre
          </button>
          
          {/* Display Reactions */}
          {reactionsCount && Object.keys(reactionsCount).length > 0 && (
            <div className="flex items-center gap-1 ml-2 bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 shadow-sm border border-gray-100 dark:border-gray-600">
              <span className="text-blue-500 text-sm">👍</span>
              <span>{Object.values(reactionsCount).reduce((a, b) => a + b, 0)}</span>
            </div>
          )}
        </div>

        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Écrivez une réponse..."
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSubmitting || !replyContent.trim()}
              className="bg-primary text-white rounded-full px-4 py-1.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        )}

        {/* Nested Replies */}
        {comment.reponses && comment.reponses.length > 0 && (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 mt-2">
            {comment.reponses.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                publicationId={publicationId}
                onReplyAdded={onReplyAdded}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
