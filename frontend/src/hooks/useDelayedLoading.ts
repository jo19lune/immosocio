import { useState, useEffect, useRef } from 'react';

/**
 * Hook pour retarder l'affichage d'un état de chargement et garantir une durée minimale d'affichage
 * @param isLoading L'état de chargement réel
 * @param delayMs Le délai avant d'afficher l'indicateur de chargement (pour éviter le flickering)
 * @param minDisplayMs La durée minimale pendant laquelle l'indicateur doit rester affiché une fois apparu
 * @returns true s'il faut afficher l'indicateur de chargement, false sinon
 */
export function useDelayedLoading(
  isLoading: boolean,
  delayMs: number = 200,
  minDisplayMs: number = 500
): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let minDisplayTimeoutId: ReturnType<typeof setTimeout>;

    if (isLoading) {
      // Démarrer un délai avant d'afficher le loader
      timeoutId = setTimeout(() => {
        startTimeRef.current = Date.now();
        setShowLoading(true);
      }, delayMs);
    } else {
      // Si on arrête de charger
      if (showLoading) {
        const elapsedTime = Date.now() - (startTimeRef.current || Date.now());
        const remainingTime = minDisplayMs - elapsedTime;

        if (remainingTime > 0) {
          // Attendre que le temps minimum d'affichage soit écoulé
          minDisplayTimeoutId = setTimeout(() => {
            setShowLoading(false);
            startTimeRef.current = null;
          }, remainingTime);
        } else {
          // Temps minimum déjà écoulé
          setShowLoading(false);
          startTimeRef.current = null;
        }
      } else {
        // Le loader n'a pas encore été affiché, annuler le délai
        clearTimeout(timeoutId!);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (minDisplayTimeoutId) clearTimeout(minDisplayTimeoutId);
    };
  }, [isLoading, delayMs, minDisplayMs, showLoading]);

  return showLoading;
}
