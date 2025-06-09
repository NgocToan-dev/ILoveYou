import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './config';
import { toDate } from '../../utils/dateUtils.js';

// Initialize or get love days data for a couple
export const initializeLoveDays = async (coupleId, startDate) => {
  try {
    const loveDaysRef = doc(db, 'loveDays', coupleId);
    
    const loveDaysData = {
      coupleId,
      startDate: Timestamp.fromDate(new Date(startDate)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(loveDaysRef, loveDaysData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error initializing love days:', error);
    return { success: false, error: error.message };
  }
};

// Get love days data
export const getLoveDays = async (coupleId) => {
  try {
    const loveDaysRef = doc(db, 'loveDays', coupleId);
    const docSnap = await getDoc(loveDaysRef);
      if (docSnap.exists()) {
      const data = docSnap.data();
      const startDate = toDate(data.startDate);
      return {
        success: true,
        data: {
          ...data,
          daysTogether: startDate ? calculateDaysTogether(startDate) : 0
        }
      };
    } else {
      return { success: false, error: 'Love days data not found' };
    }
  } catch (error) {
    console.error('Error getting love days:', error);
    return { success: false, error: error.message };
  }
};

// Update start date
export const updateLoveDaysStartDate = async (coupleId, newStartDate) => {
  try {
    const loveDaysRef = doc(db, 'loveDays', coupleId);
    
    await updateDoc(loveDaysRef, {
      startDate: Timestamp.fromDate(new Date(newStartDate)),
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating love days start date:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to love days updates
export const subscribeToLoveDays = (coupleId, callback) => {
  const loveDaysRef = doc(db, 'loveDays', coupleId);
    return onSnapshot(loveDaysRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const startDate = toDate(data.startDate);
      const loveDaysData = {
        ...data,
        daysTogether: startDate ? calculateDaysTogether(startDate) : 0,
        monthsTogether: startDate ? calculateMonthsTogether(startDate) : 0,
        yearsTogether: startDate ? calculateYearsTogether(startDate) : 0
      };
      callback(loveDaysData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in love days subscription:', error);
    callback(null);
  });
};

// Calculate days together
export const calculateDaysTogether = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = Math.abs(now - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Calculate months together
export const calculateMonthsTogether = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  
  if (now.getDate() < start.getDate()) {
    months--;
  }
  
  return Math.max(0, months);
};

// Calculate years together
export const calculateYearsTogether = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  
  let years = now.getFullYear() - start.getFullYear();
  
  if (now.getMonth() < start.getMonth() || 
      (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
};

// Get milestone information
export const getLoveMilestones = (daysTogether) => {
  const milestones = [
    { days: 7, title: 'Tuần đầu tiên', description: 'Một tuần yêu thương!' },
    { days: 30, title: 'Một tháng yêu', description: 'Một tháng ngọt ngào bên nhau' },
    { days: 50, title: '50 ngày yêu', description: '50 ngày tuyệt vời!' },
    { days: 100, title: '100 ngày yêu', description: 'Kỷ niệm 100 ngày đặc biệt' },
    { days: 200, title: '200 ngày yêu', description: '200 ngày hạnh phúc' },
    { days: 365, title: 'Một năm yêu', description: 'Một năm tình yêu đẹp đẽ!' },
    { days: 500, title: '500 ngày yêu', description: '500 ngày không thể quên' },
    { days: 730, title: 'Hai năm yêu', description: 'Hai năm tuyệt vời bên nhau' },
    { days: 1000, title: '1000 ngày yêu', description: '1000 ngày kỷ niệm!' },
    { days: 1095, title: 'Ba năm yêu', description: 'Ba năm hạnh phúc' },
    { days: 1460, title: 'Bốn năm yêu', description: 'Bốn năm tình yêu bền vững' },
    { days: 1825, title: 'Năm năm yêu', description: 'Năm năm gắn bó' }
  ];
  
  return milestones.filter(milestone => daysTogether >= milestone.days);
};

// Get next milestone
export const getNextMilestone = (daysTogether) => {
  const milestones = [
    { days: 7, title: 'Tuần đầu tiên' },
    { days: 30, title: 'Một tháng yêu' },
    { days: 50, title: '50 ngày yêu' },
    { days: 100, title: '100 ngày yêu' },
    { days: 200, title: '200 ngày yêu' },
    { days: 365, title: 'Một năm yêu' },
    { days: 500, title: '500 ngày yêu' },
    { days: 730, title: 'Hai năm yêu' },
    { days: 1000, title: '1000 ngày yêu' },
    { days: 1095, title: 'Ba năm yêu' },
    { days: 1460, title: 'Bốn năm yêu' },
    { days: 1825, title: 'Năm năm yêu' }
  ];
  
  for (let milestone of milestones) {
    if (daysTogether < milestone.days) {
      return {
        ...milestone,
        daysLeft: milestone.days - daysTogether
      };
    }
  }
  
  return null; // No more milestones
};

// Format duration
export const formatLoveDuration = (daysTogether) => {
  if (daysTogether < 30) {
    return `${daysTogether} ngày`;
  } else if (daysTogether < 365) {
    const months = Math.floor(daysTogether / 30);
    const remainingDays = daysTogether % 30;
    if (remainingDays === 0) {
      return `${months} tháng`;
    }
    return `${months} tháng ${remainingDays} ngày`;
  } else {
    const years = Math.floor(daysTogether / 365);
    const remainingDays = daysTogether % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;
    
    let result = `${years} năm`;
    if (months > 0) {
      result += ` ${months} tháng`;
    }
    if (days > 0) {
      result += ` ${days} ngày`;
    }
    return result;
  }
};