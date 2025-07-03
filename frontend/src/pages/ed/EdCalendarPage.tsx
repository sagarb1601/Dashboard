import React, { useState, useEffect } from 'react';
import { Calendar, Modal, Form, Input, Select, Button, message, Card, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { Moment } from 'moment';
import { CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { getCalendarEvents, updateEventAttendance } from '../../services/edoffice/calendarEvents';
import type { CalendarEvent, AttendanceStatus } from '../../types/calendarEvent';
import '../edofc/calendar.css';

// Configure dayjs for Ant Design Calendar
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(localeData);
dayjs.extend(weekday);
dayjs.extend(updateLocale);

const { TextArea } = Input;

// Event type colors
const eventTypeColors: Record<string, string> = {
  event: 'purple',
  training: 'green',
  meeting: 'blue',
  other: 'orange'
};

const eventTypeLabels: Record<string, string> = {
  event: 'Event',
  training: 'Training',
  meeting: 'Meeting',
  other: 'Other'
};

// Create a wrapper component for icons
const IconWrapper: React.FC<{ icon: React.ComponentType<any> }> = ({ icon: Icon }) => (
  <Icon style={{ fontSize: '14px' }} />
);

// Attendance status colors and icons
const attendanceStatusConfig = {
  attending: {
    color: 'success',
    label: 'Attending',
    icon: CheckCircleOutlined
  },
  not_attending: {
    color: 'error',
    label: 'Not Attending',
    icon: CloseCircleOutlined
  },
  sending_representative: {
    color: 'warning',
    label: 'Sending Representative',
    icon: UserSwitchOutlined
  }
} as const;

// Add type definition for attendance status keys
type AttendanceStatusKey = 'attending' | 'not_attending' | 'sending_representative';

// Add status color mapping
const statusColors: Record<AttendanceStatusKey, string> = {
  attending: '#52c41a',      // success green
  not_attending: '#ff4d4f',  // error red
  sending_representative: '#faad14'  // warning orange
};

// Daily Timeline View Component - Google Calendar Style
const DailyTimelineView: React.FC<{
  selectedDate: Moment;
  events: CalendarEvent[];
  onDateChange: (date: Moment) => void;
  onEventClick: (event: CalendarEvent) => void;
}> = ({ selectedDate, events, onDateChange, onEventClick }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM (business hours)
  
  // Get events for the selected date
  const dayEvents = events.filter(event => {
    const eventStart = dayjs(event.start_time);
    const eventEnd = dayjs(event.end_time);
    const selectedDateStart = dayjs(selectedDate.toDate()).startOf('day');
    
    // Show event if it spans across the selected date
    return eventStart.isSameOrBefore(selectedDateStart, 'day') && 
           eventEnd.isSameOrAfter(selectedDateStart, 'day');
  });

  // Group overlapping events
  const getOverlappingEvents = () => {
    const sortedEvents = dayEvents.sort((a, b) => 
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    );
    
    const groups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      
      let addedToGroup = false;
      
      for (const group of groups) {
        const groupHasOverlap = group.some(groupEvent => {
          const groupEventStart = dayjs(groupEvent.start_time);
          const groupEventEnd = dayjs(groupEvent.end_time);
          
          // Check if events overlap
          return (eventStart.isBefore(groupEventEnd) && eventEnd.isAfter(groupEventStart));
        });
        
        if (groupHasOverlap) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([event]);
      }
    });
    
    return groups;
  };

  const getEventPosition = (event: CalendarEvent, groupIndex: number, groupSize: number) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    
    // Calculate time position (6 AM = 0%, 10 PM = 100%)
    const startHour = startTime.hour() + startTime.minute() / 60;
    const endHour = endTime.hour() + endTime.minute() / 60;
    
    // Ensure events are within business hours (6 AM to 10 PM)
    const adjustedStartHour = Math.max(6, Math.min(22, startHour));
    const adjustedEndHour = Math.max(adjustedStartHour + 0.5, Math.min(22, endHour));
    
    const top = ((adjustedStartHour - 6) / 17) * 100; // 6 AM to 10 PM = 17 hours (6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22)
    const height = ((adjustedEndHour - adjustedStartHour) / 17) * 100;
    
    // Calculate horizontal position for overlapping events
    const left = (groupIndex / groupSize) * 100;
    const width = (1 / groupSize) * 100 - 2; // Leave 2px gap between events
    
    return { 
      top: `${top}%`, 
      height: `${height}%`,
      left: `${left}%`,
      width: `${width}%`
    };
  };

  const overlappingGroups = getOverlappingEvents();

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fafafa', 
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>{selectedDate.format('dddd, MMMM D, YYYY')}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs(selectedDate.toDate()).subtract(1, 'day') as unknown as Moment)}
          >
            Previous Day
          </Button>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs() as unknown as Moment)}
          >
            Today
          </Button>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs(selectedDate.toDate()).add(1, 'day') as unknown as Moment)}
          >
            Next Day
          </Button>
        </div>
      </div>
      
      {/* Timeline */}
      <div style={{ display: 'flex', height: 'calc(17 * 60px)' }}>
        {/* Time Labels */}
        <div style={{ 
          width: '60px', 
          borderRight: '1px solid #d9d9d9',
          backgroundColor: '#fafafa'
        }}>
          {hours.map(hour => (
            <div 
              key={hour}
              style={{
                height: `${100 / 17}%`,
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666'
              }}
            >
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>
        
        {/* Events Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Hour Grid Lines */}
          {hours.map(hour => (
            <div 
              key={hour}
              style={{
                position: 'absolute',
                top: `${((hour - 6) / 17) * 100}%`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#e8e8e8',
                zIndex: 1
              }}
            />
          ))}
          
          {/* Events */}
          {overlappingGroups.map((group, groupIndex) => 
            group.map((event, eventIndex) => {
              const position = getEventPosition(event, eventIndex, group.length);
              const status = event.ed_attendance_status as AttendanceStatusKey;
              const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;
              
              // Create tooltip content
              const tooltipContent = (
                <div>
                  <div><strong>{event.title}</strong></div>
                  <div>Type: {eventTypeLabels[event.event_type] || 'Other'}</div>
                  <div>Start: {dayjs(event.start_time).format('MMM D, YYYY h:mm A')}</div>
                  <div>End: {dayjs(event.end_time).format('MMM D, YYYY h:mm A')}</div>
                  {event.description && <div>Description: {event.description}</div>}
                  {status && statusConfig && (
                    <div>
                      Status: <span style={{ color: statusColors[status] }}>
                        {statusConfig.label}
                      </span>
                    </div>
                  )}
                </div>
              );
              
              return (
                <Tooltip 
                  key={event.id}
                  title={tooltipContent}
                  placement="top"
                  mouseEnterDelay={0.5}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: position.left,
                      top: position.top,
                      height: position.height,
                      width: position.width,
                      backgroundColor: eventTypeColors[event.event_type],
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                      zIndex: 2,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>
                      {dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}
                    </div>
                    {status && statusConfig && (
                      <div className="event-status-icon" style={{ color: statusColors[status as AttendanceStatusKey] }}>
                        <IconWrapper icon={statusConfig.icon} />
                      </div>
                    )}
                  </div>
                </Tooltip>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Weekly Grid View Component - Google Calendar Style
const WeeklyGridView: React.FC<{
  selectedDate: Moment;
  events: CalendarEvent[];
  onDateChange: (date: Moment) => void;
  onEventClick: (event: CalendarEvent) => void;
}> = ({ selectedDate, events, onDateChange, onEventClick }) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM (business hours)
  const days = Array.from({ length: 7 }, (_, i) => 
    dayjs(selectedDate.toDate()).startOf('week').add(i, 'day')
  );

  // Get events for the week
  const weekEvents = events.filter(event => {
    const eventStart = dayjs(event.start_time);
    const eventEnd = dayjs(event.end_time);
    const weekStart = dayjs(selectedDate.toDate()).startOf('week');
    const weekEnd = dayjs(selectedDate.toDate()).endOf('week');
    
    // Check if event spans across any day in the week
    const isInWeek = eventStart.isSameOrBefore(weekEnd, 'day') && 
                    eventEnd.isSameOrAfter(weekStart, 'day');
    
    // Check if event has any overlap with business hours (6 AM to 10 PM)
    const startHour = eventStart.hour() + eventStart.minute() / 60;
    const endHour = eventEnd.hour() + eventEnd.minute() / 60;
    const hasBusinessHourOverlap = (startHour < 22 && endHour > 6);
    
    return isInWeek && hasBusinessHourOverlap;
  });

  // Group events by day and handle overlapping events within each day
  const getDayEvents = (dayIndex: number) => {
    const dayStart = days[dayIndex].startOf('day');
    const dayEnd = days[dayIndex].endOf('day');
    
    const dayEvents = weekEvents.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      return eventStart.isSameOrBefore(dayEnd, 'day') && 
             eventEnd.isSameOrAfter(dayStart, 'day');
    });

    // Sort events by start time
    const sortedEvents = dayEvents.sort((a, b) => 
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()
    );
    
    const groups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      
      let addedToGroup = false;
      
      for (const group of groups) {
        const groupHasOverlap = group.some(groupEvent => {
          const groupEventStart = dayjs(groupEvent.start_time);
          const groupEventEnd = dayjs(groupEvent.end_time);
          
          // Check if events overlap
          return (eventStart.isBefore(groupEventEnd) && eventEnd.isAfter(groupEventStart));
        });
        
        if (groupHasOverlap) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([event]);
      }
    });
    
    return groups;
  };

  const getEventPosition = (event: CalendarEvent, dayIndex: number, groupIndex: number, groupSize: number) => {
    const startTime = dayjs(event.start_time);
    const endTime = dayjs(event.end_time);
    const startHour = startTime.hour() + startTime.minute() / 60;
    const endHour = endTime.hour() + endTime.minute() / 60;
    
    // Ensure events are within business hours (6 AM to 10 PM)
    const adjustedStartHour = Math.max(6, Math.min(22, startHour));
    const adjustedEndHour = Math.max(adjustedStartHour + 0.5, Math.min(22, endHour));
    const duration = adjustedEndHour - adjustedStartHour;
    
    // Calculate position within the 17-hour timeline (6 AM to 10 PM)
    const top = ((adjustedStartHour - 6) / 17) * 100;
    const height = (duration / 17) * 100;
    
    // Calculate horizontal position for the day
    const dayLeft = (dayIndex / 7) * 100;
    const dayWidth = (1 / 7) * 100;
    
    // Calculate position within the day for overlapping events
    const eventLeft = dayLeft + (groupIndex / groupSize) * dayWidth;
    const eventWidth = (1 / groupSize) * dayWidth - 2; // Leave 2px gap between events
    
    // Ensure the event is within the timeline bounds
    const constrainedTop = Math.max(0, Math.min(100 - height, top));
    
    return { 
      top: `${constrainedTop}%`, 
      height: `${height}%`, 
      left: `${eventLeft}%`, 
      width: `${eventWidth}%` 
    };
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#fafafa', 
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>
          {dayjs(selectedDate.toDate()).startOf('week').format('MMM D')} - {dayjs(selectedDate.toDate()).endOf('week').format('MMM D, YYYY')}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs(selectedDate.toDate()).subtract(1, 'week') as unknown as Moment)}
          >
            Previous Week
          </Button>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs() as unknown as Moment)}
          >
            This Week
          </Button>
          <Button 
            size="small"
            onClick={() => onDateChange(dayjs(selectedDate.toDate()).add(1, 'week') as unknown as Moment)}
          >
            Next Week
          </Button>
        </div>
      </div>
      
      {/* Week Grid */}
      <div style={{ display: 'flex', height: 'calc(17 * 60px + 40px)' }}>
        {/* Time Labels */}
        <div style={{ 
          width: '60px', 
          borderRight: '1px solid #d9d9d9',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ height: '40px', borderBottom: '1px solid #d9d9d9' }}></div>
          {hours.map(hour => (
            <div 
              key={hour}
              style={{
                height: `${100 / 17}%`,
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666'
              }}
            >
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>
        
        {/* Days Headers and Events */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Days Headers */}
          <div style={{ display: 'flex', height: '40px' }}>
            {days.map((day, index) => (
              <div 
                key={index}
                style={{
                  flex: 1,
                  borderRight: '1px solid #d9d9d9',
                  backgroundColor: day.isSame(dayjs(), 'day') ? '#e6f7ff' : '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: day.isSame(dayjs(), 'day') ? 'bold' : 'normal'
                }}
              >
                <div>{day.format('ddd')}</div>
                <div>{day.format('D')}</div>
              </div>
            ))}
          </div>
          
          {/* Events Area */}
          <div style={{ 
            position: 'relative', 
            height: 'calc(17 * 60px)',
            borderTop: '1px solid #d9d9d9'
          }}>
            {/* Day Grid Lines */}
            {days.map((_, index) => (
              <div 
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${(index / 7) * 100}%`,
                  width: '1px',
                  backgroundColor: '#d9d9d9',
                  zIndex: 1
                }}
              />
            ))}
            
            {/* Events */}
            {days.map((day, dayIndex) => 
              getDayEvents(dayIndex).map((group, groupIndex) => 
                group.map((event, eventIndex) => {
                  const position = getEventPosition(event, dayIndex, eventIndex, group.length);
                  const status = event.ed_attendance_status as AttendanceStatusKey;
                  const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;
                  
                  // Create tooltip content
                  const tooltipContent = (
                    <div>
                      <div><strong>{event.title}</strong></div>
                      <div>Type: {eventTypeLabels[event.event_type] || 'Other'}</div>
                      <div>Start: {dayjs(event.start_time).format('MMM D, YYYY h:mm A')}</div>
                      <div>End: {dayjs(event.end_time).format('MMM D, YYYY h:mm A')}</div>
                      {event.description && <div>Description: {event.description}</div>}
                      {status && statusConfig && (
                        <div>
                          Status: <span style={{ color: statusColors[status] }}>
                            {statusConfig.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                  
                  return (
                    <Tooltip 
                      key={event.id}
                      title={tooltipContent}
                      placement="top"
                      mouseEnterDelay={0.5}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: position.left,
                          top: position.top,
                          height: position.height,
                          width: position.width,
                          backgroundColor: eventTypeColors[event.event_type],
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          zIndex: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>
                          {dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}
                        </div>
                        {status && statusConfig && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '2px', 
                            right: '4px',
                            color: statusColors[status]
                          }}>
                            <IconWrapper icon={statusConfig.icon} />
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Legend Component
const CalendarLegend: React.FC = () => {
  return (
    <div style={{ 
      marginBottom: '16px', 
      padding: '8px 12px', 
      backgroundColor: '#fafafa', 
      borderRadius: '6px',
      border: '1px solid #d9d9d9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px', marginRight: '8px' }}>
          Legend:
        </span>
        
        {/* Event Types */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Event Types:</span>
          {Object.entries(eventTypeColors).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div 
                style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: color, 
                  borderRadius: '2px',
                  flexShrink: 0
                }} 
              />
              <span style={{ fontSize: '12px' }}>{eventTypeLabels[type]}</span>
            </div>
          ))}
        </div>
        
        {/* Attendance Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Status:</span>
          {Object.entries(attendanceStatusConfig).map(([status, config]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ color: statusColors[status as AttendanceStatusKey] }}>
                <IconWrapper icon={config.icon} />
              </div>
              <span style={{ fontSize: '12px' }}>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EdCalendarPage: React.FC<{ initialView?: string | null }> = ({ initialView }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Moment>(dayjs() as unknown as Moment);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'daily-timeline' | 'weekly-grid'>('month');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Update view mode when initialView prop changes
  useEffect(() => {
    if (initialView === 'weekly') {
      setViewMode('weekly-grid');
    }
  }, [initialView]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openAttendanceModal = (event: CalendarEvent) => {
    form.resetFields();
    form.setFieldsValue({
      status: event.ed_attendance_status || undefined,
      remarks: event.ed_attendance_remarks || ''
    });
    setIsModalVisible(true);
    setSelectedEvent(event);
  };

  const handleAttendanceUpdate = async (values: { status: AttendanceStatus; remarks?: string }) => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = await updateEventAttendance(
        selectedEvent.id,
        values.status,
        values.remarks
      );
      
      setEvents(events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      
      message.success('Attendance status updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating attendance:', error);
      message.error('Failed to update attendance status');
    }
  };

  const dateCellRender = (value: Moment) => {
    const date = dayjs(value.toDate());
    
    // For month view, only show events for dates that belong to the currently viewed month
    const currentMonth = selectedDate.month();
    const currentYear = selectedDate.year();
    
    // Check if the date belongs to the current month view
    const isCurrentMonth = date.month() === currentMonth && date.year() === currentYear;
    
    // If it's not the current month, return a hidden placeholder
    if (!isCurrentMonth) {
      return (
        <div 
          className="other-month-placeholder" 
          style={{ 
            display: 'none',
            height: '0',
            minHeight: '0',
            padding: '0',
            margin: '0',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Hidden placeholder for other month dates */}
        </div>
      );
    }
    
    const dayEvents = events.filter(event => {
      const eventStart = dayjs(event.start_time);
      const eventEnd = dayjs(event.end_time);
      const currentDate = date.startOf('day');
      
      // Show event if it spans across the current date
      // Event should be shown if:
      // 1. Event starts on or before the current date AND
      // 2. Event ends on or after the current date
      return eventStart.isSameOrBefore(currentDate, 'day') && 
             eventEnd.isSameOrAfter(currentDate, 'day');
    });

    return (
      <div className={`calendar-cell ${date.isSame(dayjs(), 'day') ? 'today' : ''} ${date.isBefore(dayjs(), 'day') ? 'past' : ''}`}>
        {dayEvents.map(event => {
          const isPast = dayjs(event.start_time).isBefore(dayjs().startOf('day'));
          const status = event.ed_attendance_status as AttendanceStatusKey;
          const statusConfig = status && status in attendanceStatusConfig ? attendanceStatusConfig[status] : null;
          
          return (
            <Tooltip 
              key={event.id}
              title={
                <div>
                  <div><strong>{event.title}</strong></div>
                  <div>{dayjs(event.start_time).format('h:mm A')} - {dayjs(event.end_time).format('h:mm A')}</div>
                  <div>Type: {eventTypeLabels[event.event_type]}</div>
                  {status && statusConfig && (
                    <div>
                      Status: {statusConfig.label}
                    </div>
                  )}
                  {event.ed_attendance_remarks && (
                    <div>
                      Remarks: {event.ed_attendance_remarks}
                    </div>
                  )}
                </div>
              }
            >
              <div 
                className="event-item"
                style={{ 
                  backgroundColor: eventTypeColors[event.event_type],
                  opacity: isPast ? 0.7 : 1,
                  cursor: 'pointer'
                }}
                onClick={() => openAttendanceModal(event)}
              >
                <div className="event-title">
                  {event.title}
                </div>
                {status && statusConfig && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                    <div className="event-status-icon" style={{ color: statusColors[status as AttendanceStatusKey] }}>
                      <IconWrapper icon={statusConfig.icon} />
                    </div>
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '12px' }}>
      <Card style={{ margin: '8px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <Button 
            type={viewMode === 'month' ? 'primary' : 'default'}
            onClick={() => setViewMode('month')}
          >
            Month View
          </Button>
          <Button 
            type={viewMode === 'daily-timeline' ? 'primary' : 'default'}
            onClick={() => setViewMode('daily-timeline')}
          >
            Daily Timeline
          </Button>
          <Button 
            type={viewMode === 'weekly-grid' ? 'primary' : 'default'}
            onClick={() => setViewMode('weekly-grid')}
          >
            Weekly Grid
          </Button>
        </div>
        
        {/* Legend Component */}
        <CalendarLegend />
        
        {/* Original Calendar for Month view only */}
        {viewMode === 'month' && (
          <Calendar
            dateCellRender={dateCellRender}
            value={selectedDate}
            onChange={(date: Moment) => setSelectedDate(date)}
            onSelect={(date: Moment) => setSelectedDate(date)}
            className="month-only-calendar"
            fullscreen={true}
          />
        )}
        
        {/* Daily Timeline View - Google Calendar Style */}
        {viewMode === 'daily-timeline' && (
          <DailyTimelineView 
            selectedDate={selectedDate}
            events={events}
            onDateChange={setSelectedDate}
            onEventClick={openAttendanceModal}
          />
        )}
        
        {/* Weekly Grid View - Google Calendar Style */}
        {viewMode === 'weekly-grid' && (
          <WeeklyGridView 
            selectedDate={selectedDate}
            events={events}
            onDateChange={setSelectedDate}
            onEventClick={openAttendanceModal}
          />
        )}
      </Card>
      <Modal
        title="Update Attendance Status"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedEvent(null);
          form.resetFields();
        }}
        footer={null}
      >
        {selectedEvent && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAttendanceUpdate}
            initialValues={{
              status: selectedEvent.ed_attendance_status || undefined,
              remarks: selectedEvent.ed_attendance_remarks
            }}
          >
            <Form.Item
              name="status"
              label="Attendance Status"
              rules={[{ required: true, message: 'Please select your attendance status' }]}
            >
              <Select>
                {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                  <Select.Option key={status} value={status}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: statusColors[status as AttendanceStatusKey] }}>
                        <IconWrapper icon={config.icon} />
                      </div>
                      <span>{config.label}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="remarks"
              label="Remarks"
            >
              <TextArea rows={4} placeholder="Add any remarks about your attendance" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update Status
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      <style>
        {`
          .calendar-cell {
            min-height: 80px;
            padding: 4px;
            overflow: hidden;
          }
          .calendar-cell.today {
            background-color: #e6f7ff;
            border-radius: 4px;
          }
          .calendar-cell.past {
            background-color: #fafafa;
          }
          /* Hide other month placeholders completely */
          .other-month-placeholder {
            display: none !important;
          }
          /* Make other month dates transparent and non-interactive */
          .month-only-calendar .ant-picker-calendar-date:has(.other-month-placeholder) {
            opacity: 0.1 !important;
            pointer-events: none !important;
            background-color: transparent !important;
          }
          /* Alternative: hide the date value for other month dates */
          .month-only-calendar .ant-picker-calendar-date:has(.other-month-placeholder) .ant-picker-calendar-date-value {
            opacity: 0.1 !important;
            color: #ccc !important;
          }
          .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
            color: #1890ff;
            font-weight: bold;
          }
          /* Hide the navigation buttons */
          .month-only-calendar .ant-picker-calendar-header .ant-picker-calendar-header-controls {
            display: none !important;
          }
          /* Hide the month/year select boxes */
          .month-only-calendar .ant-picker-calendar-header .ant-picker-calendar-mode-switch {
            display: none !important;
          }
          /* Hide the entire header view */
          .month-only-calendar .ant-picker-calendar-header .ant-picker-calendar-header-view {
            display: none !important;
          }
          /* Calendar cell content styles */
          .ant-picker-calendar-date-content {
            height: auto !important;
            overflow: hidden !important;
          }
          .ant-picker-calendar-date {
            padding: 4px !important;
          }
          .ant-picker-calendar-date-value {
            margin: 0 !important;
          }
          /* Event item styles */
          .event-item {
            margin-bottom: 2px;
            padding: 2px 4px;
            border-radius: 2px;
            color: white;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
          }
          .event-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 4px;
          }
          .event-status-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
};

export default EdCalendarPage; 