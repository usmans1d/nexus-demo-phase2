import api from '../api';
import { CollaborationRequest } from '../types';

// Helper function to get meetings (collaboration requests) for the current user
export const getMyRequests = async (): Promise<CollaborationRequest[]> => {
  try {
    const res = await api.get('/meetings');
    // Map backend Meeting schema to frontend CollaborationRequest schema
    return res.data.map((meeting: any) => ({
      id: meeting._id,
      investorId: meeting.requester,
      entrepreneurId: meeting.recipient,
      message: 'Meeting Request',
      status: meeting.status,
      createdAt: meeting.date
    }));
  } catch (error) {
    console.error("Failed to fetch meetings", error);
    return [];
  }
};

// Keep old signature for compatibility, but just return getMyRequests
export const getRequestsForEntrepreneur = async (entrepreneurId: string): Promise<CollaborationRequest[]> => {
  return getMyRequests();
};

export const getRequestsFromInvestor = async (investorId: string): Promise<CollaborationRequest[]> => {
  return getMyRequests();
};

export const updateRequestStatus = async (requestId: string, newStatus: 'pending' | 'accepted' | 'rejected'): Promise<CollaborationRequest | null> => {
  try {
    const endpoint = newStatus === 'accepted' ? `/meetings/${requestId}/accept` : `/meetings/${requestId}/reject`;
    const res = await api.put(endpoint);
    const meeting = res.data;
    return {
      id: meeting._id,
      investorId: meeting.requester,
      entrepreneurId: meeting.recipient,
      message: 'Meeting Request',
      status: meeting.status,
      createdAt: meeting.date
    };
  } catch (error) {
    console.error("Failed to update status", error);
    throw error;
  }
};

export const createCollaborationRequest = async (
  investorId: string,
  entrepreneurId: string,
  message: string,
  date: string = new Date().toISOString()
): Promise<CollaborationRequest> => {
  try {
    const res = await api.post('/meetings', {
      recipient: entrepreneurId,
      date: date
    });
    const meeting = res.data;
    return {
      id: meeting._id,
      investorId: meeting.requester,
      entrepreneurId: meeting.recipient,
      message: 'Meeting Request',
      status: meeting.status,
      createdAt: meeting.date
    };
  } catch (error) {
    console.error("Failed to create meeting", error);
    throw error;
  }
};