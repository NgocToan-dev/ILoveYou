import { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@shared/services/firebase/config';
import { getUserProfile } from '@shared/services/firebase/firestore';

// Custom hook to subscribe to user profile changes
export const useUserProfile = (userId) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      async (doc) => {
        try {
          if (doc.exists()) {
            // Get enhanced profile with couple information
            const profile = await getUserProfile(userId);
            setUserProfile(profile);
            setError(null);
          } else {
            setUserProfile(null);
            setError('User profile not found');
          }
        } catch (err) {
          console.error('Error in user profile subscription:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error subscribing to user profile:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
      setError(null);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { userProfile, loading, error, refreshProfile };
};

// Custom hook to subscribe to couple changes
export const useCoupleData = (userId) => {
  const [coupleData, setCoupleData] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setCoupleData(null);
      setPartnerProfile(null);
      setLoading(false);
      return;
    }

    // Set up real-time listener for user document to get coupleId
    const userUnsubscribe = onSnapshot(
      doc(db, 'users', userId),
      async (userDoc) => {
        try {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const coupleId = userData.coupleId;

            if (coupleId) {
              // Set up listener for couple document
              const coupleUnsubscribe = onSnapshot(
                doc(db, 'couples', coupleId),
                async (coupleDoc) => {
                  try {
                    if (coupleDoc.exists()) {
                      const couple = {
                        id: coupleDoc.id,
                        ...coupleDoc.data()
                      };
                      setCoupleData(couple);

                      // Get partner information
                      const partnerId = couple.user1?.id === userId 
                        ? couple.user2?.id 
                        : couple.user1?.id;

                      if (partnerId) {
                        const partnerProfile = await getUserProfile(partnerId);
                        setPartnerProfile(partnerProfile);
                      }
                      
                      setError(null);
                    } else {
                      setCoupleData(null);
                      setPartnerProfile(null);
                    }
                  } catch (err) {
                    console.error('Error in couple subscription:', err);
                    setError(err.message);
                  }
                }
              );

              // Return couple unsubscribe function
              return coupleUnsubscribe;
            } else {
              setCoupleData(null);
              setPartnerProfile(null);
            }
          }
        } catch (err) {
          console.error('Error in user subscription for couple:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    );

    return userUnsubscribe;
  }, [userId]);

  return { coupleData, partnerProfile, loading, error };
};

export default { useUserProfile, useCoupleData };
