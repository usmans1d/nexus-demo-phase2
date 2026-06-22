import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { getMyRequests } from '../../data/collaborationRequests';
import { CollaborationRequest } from '../../types';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const data = await getMyRequests();
        setMeetings(data || []);
      } catch (error) {
        console.error('Error fetching meetings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage your upcoming meetings</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800 w-40 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-gray-500 py-3 uppercase tracking-wider">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find meetings for this day
        const dayMeetings = meetings.filter(m => {
          if (!m.createdAt) return false;
          return isSameDay(new Date(m.createdAt), cloneDay);
        });

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[140px] p-3 border-r border-b border-gray-100 transition-all duration-200 ${
              !isSameMonth(day, monthStart) ? 'bg-gray-50/50 text-gray-400' : 'bg-white text-gray-800'
            } ${isSameDay(day, new Date()) ? 'bg-primary-50/30 ring-1 ring-inset ring-primary-100' : 'hover:bg-gray-50'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                isSameDay(day, new Date()) ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30' : ''
              }`}>
                {formattedDate}
              </span>
              {dayMeetings.length > 0 && (
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {dayMeetings.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[90px] pr-1 custom-scrollbar">
              {dayMeetings.map((meeting, idx) => (
                <div key={idx} className={`text-xs p-2 rounded-lg truncate transition-transform hover:scale-[1.02] cursor-pointer ${
                  meeting.status === 'accepted' ? 'bg-success-50 text-success-800 border border-success-200 hover:bg-success-100' :
                  meeting.status === 'pending' ? 'bg-warning-50 text-warning-800 border border-warning-200 hover:bg-warning-100' :
                  'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className={meeting.status === 'accepted' ? 'text-success-600' : meeting.status === 'pending' ? 'text-warning-600' : 'text-gray-500'} />
                    <span className="font-semibold">{format(new Date(meeting.createdAt!), 'HH:mm')}</span>
                  </div>
                  <div className="mt-1 opacity-90 capitalize font-medium">{meeting.status}</div>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-gray-100 bg-white rounded-b-xl overflow-hidden">{rows}</div>;
  };

  const upcomingMeetings = meetings
    .filter(m => m.createdAt && new Date(m.createdAt) >= new Date() && m.status === 'accepted')
    .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {renderHeader()}
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden">
            {renderDays()}
            {renderCells()}
          </Card>
        </div>
        
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-md border border-gray-200 sticky top-6">
            <CardHeader className="bg-gray-50/80 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon size={20} className="text-primary-600" />
                Upcoming Meetings
              </h2>
            </CardHeader>
            <CardBody className="p-4">
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="py-10 text-center text-gray-500 flex flex-col items-center gap-3">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <CalendarIcon size={24} className="text-gray-400" />
                  </div>
                  <p>No upcoming accepted meetings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="success" size="sm" className="bg-success-100 text-success-800">Accepted</Badge>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                          <Clock size={12} className="text-primary-600" />
                          {format(new Date(meeting.createdAt!), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mb-4 line-clamp-2">
                        Meeting ID: {meeting.id.slice(-6)}
                      </p>
                      
                      <button 
                        onClick={() => navigate('/chat')}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/20"
                      >
                        <Video size={16} /> Join Call via Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
