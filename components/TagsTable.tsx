'use client';

import { useState } from 'react';
import { usePLCData } from '@/hooks/usePLCData';
import { PLCData } from '@/types/plc-data';

interface TagsTableProps {
  machineId?: string;
  machineType?: string;
}

export function TagsTable({ machineId = 'machine-01', machineType }: TagsTableProps) {
  const { data, isLoading, error } = usePLCData(machineId, machineType);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    counter: true,
    alarm: true,
    analog: true,
    input: true,
    tooling: true,
    coolant: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-dark-panel p-6 rounded-lg border border-dark-border">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mb-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-white text-lg font-semibold">All Tag Values</h3>
          <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && <div className="text-gray-400">Loading...</div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-panel p-6 rounded-lg border border-dark-border">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mb-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-white text-lg font-semibold">All Tag Values</h3>
          <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && <div className="text-red-400">Error loading data</div>}
      </div>
    );
  }

  // Check if we have actual data
  const hasData = data && data._time;

  if (!hasData && !isLoading) {
    return (
      <div className="bg-dark-panel p-6 rounded-lg border border-dark-border">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mb-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-white text-lg font-semibold">All Tag Values</h3>
          <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
        <div className="text-yellow-400 p-4 text-center">
          ⚠️ No data available for {machineId}
          <br />
          <span className="text-gray-500 text-sm mt-2 block">
            To see data for this machine, run:
            <br />
            <code className="bg-midnight-200 px-2 py-1 rounded mt-1 inline-block border border-dark-border">
              ./start_mock_plc.sh {machineId}
            </code>
          </span>
        </div>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-dark-panel p-6 rounded-lg border border-dark-border">
        <h3 className="text-white text-lg font-semibold mb-4">All Tag Values</h3>
        <div className="text-red-400">Error loading data</div>
      </div>
    );
  }

  // Organize fields by category - different fields for bottle filler vs lathe
  const isLathe = machineType === 'lathe';

  const statusFields = isLathe ? [
    { label: 'System Running', value: data.SystemRunning, type: 'boolean' },
    { label: 'Machining', value: data.Machining, type: 'boolean' },
    { label: 'Ready', value: data.Ready, type: 'boolean' },
    { label: 'Fault', value: !data.Fault, type: 'boolean' }, // Invert
    { label: 'Auto Mode', value: data.AutoMode, type: 'boolean' },
  ] : [
    { label: 'System Running', value: data.SystemRunning, type: 'boolean' },
    { label: 'Fault', value: !data.Fault, type: 'boolean' }, // Invert
    { label: 'Filling', value: data.Filling, type: 'boolean' },
    { label: 'Ready', value: data.Ready, type: 'boolean' },
  ];

  const counterFields = isLathe ? [
    { label: 'Parts Completed', value: data.PartsCompleted, type: 'number' },
    { label: 'Parts Rejected', value: data.PartsRejected, type: 'number' },
    { label: 'Parts Per Hour', value: data.PartsPerHour, type: 'number' },
    { label: 'Cycle Time', value: data.CycleTime, type: 'number', unit: 's' },
  ] : [
    { label: 'Bottles Filled', value: data.BottlesFilled, type: 'number' },
    { label: 'Bottles Rejected', value: data.BottlesRejected, type: 'number' },
    { label: 'Bottles Per Minute', value: data.BottlesPerMinute, type: 'number' },
  ];

  const alarmFields = isLathe ? [
    { label: 'Alarm Spindle Overload', value: data.AlarmSpindleOverload, type: 'boolean' },
    { label: 'Alarm Chuck Not Clamped', value: data.AlarmChuckNotClamped, type: 'boolean' },
    { label: 'Alarm Door Open', value: data.AlarmDoorOpen, type: 'boolean' },
    { label: 'Alarm Tool Wear', value: data.AlarmToolWear, type: 'boolean' },
    { label: 'Alarm Coolant Low', value: data.AlarmCoolantLow, type: 'boolean' },
  ] : [
    { label: 'Alarm Fault', value: data.AlarmFault, type: 'boolean' },
    { label: 'Alarm Overfill', value: data.AlarmOverfill, type: 'boolean' },
    { label: 'Alarm Underfill', value: data.AlarmUnderfill, type: 'boolean' },
    { label: 'Alarm Low Product Level', value: data.AlarmLowProductLevel, type: 'boolean' },
    { label: 'Alarm Cap Missing', value: data.AlarmCapMissing, type: 'boolean' },
  ];

  const analogFields = isLathe ? [
    { label: 'Spindle Speed', value: data.SpindleSpeed, type: 'number', unit: 'RPM' },
    { label: 'Spindle Speed Setpoint', value: data.SpindleSpeedSetpoint, type: 'number', unit: 'RPM' },
    { label: 'Spindle Load', value: data.SpindleLoad, type: 'number', unit: '%' },
    { label: 'Axis X Position', value: data.AxisXPosition, type: 'number', unit: 'mm' },
    { label: 'Axis X Feedrate', value: data.AxisXFeedrate, type: 'number', unit: 'mm/min' },
    { label: 'Axis Z Position', value: data.AxisZPosition, type: 'number', unit: 'mm' },
    { label: 'Axis Z Feedrate', value: data.AxisZFeedrate, type: 'number', unit: 'mm/min' },
  ] : [
    { label: 'Tank Temperature', value: data.TankTemperature, type: 'number', unit: '°C' },
    { label: 'Tank Pressure', value: data.TankPressure, type: 'number', unit: 'PSI' },
    { label: 'Fill Flow Rate', value: data.FillFlowRate, type: 'number', unit: 'L/min' },
    { label: 'Conveyor Speed', value: data.ConveyorSpeed, type: 'number', unit: 'RPM' },
  ];

  const inputFields = isLathe ? [
    { label: 'Door Closed', value: data.DoorClosed, type: 'boolean' },
    { label: 'E-Stop OK', value: data.EStopOK, type: 'boolean' },
    { label: 'Axis X Homed', value: data.AxisXHomed, type: 'boolean' },
    { label: 'Axis Z Homed', value: data.AxisZHomed, type: 'boolean' },
  ] : [
    { label: 'Low Level Sensor', value: data.LowLevelSensor, type: 'boolean' },
  ];

  // Lathe-specific additional sections
  const toolingFields = isLathe ? [
    { label: 'Tool Number', value: data.ToolNumber, type: 'number' },
    { label: 'Tool Life Percent', value: data.ToolLifePercent, type: 'number', unit: '%' },
    { label: 'Tool Offset X', value: data.ToolOffsetX, type: 'number', unit: 'mm' },
    { label: 'Tool Offset Z', value: data.ToolOffsetZ, type: 'number', unit: 'mm' },
  ] : [];

  const coolantFields = isLathe ? [
    { label: 'Coolant Flow Rate', value: data.CoolantFlowRate, type: 'number', unit: 'L/min' },
    { label: 'Coolant Temperature', value: data.CoolantTemperature, type: 'number', unit: '°C' },
    { label: 'Coolant Level Percent', value: data.CoolantLevelPercent, type: 'number', unit: '%' },
  ] : [];

  const formatValue = (value: any, type: string, unit?: string) => {
    if (type === 'boolean') {
      return value ? '✓ TRUE' : '✗ FALSE';
    }
    if (type === 'number') {
      return `${value.toFixed(2)}${unit ? ` ${unit}` : ''}`;
    }
    return String(value);
  };

  const getStatusColor = (value: any, type: string, isAlarm: boolean = false) => {
    if (type === 'boolean') {
      if (isAlarm) {
        // For alarms: true = active (red), false = OK (green)
        return value ? 'text-red-400' : 'text-green-400';
      }
      // For status fields: true = good (green), false = bad (gray)
      return value ? 'text-green-400' : 'text-gray-400';
    }
    return 'text-white';
  };

  // Format timestamp to EST
  const formatESTTime = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' EST';
  };

  return (
    <div className="bg-dark-panel p-6 rounded-lg border border-dark-border">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
        <h3 className="text-white text-lg font-semibold">All Tag Values</h3>
          <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
        <div className="text-gray-400 text-sm">
          Last updated: {formatESTTime(data._time)}
        </div>
        )}
      </div>

      {isExpanded && (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left text-gray-400 py-2 px-4">Field</th>
              <th className="text-left text-gray-400 py-2 px-4">Value</th>
              <th className="text-left text-gray-400 py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Timestamp Row */}
            {data._time && (
              <tr className="border-b border-dark-border bg-midnight-200/30">
                <td colSpan={3} className="text-gray-400 text-xs py-2 px-4">
                  📅 Data Timestamp: {formatESTTime(data._time)}
                </td>
              </tr>
            )}
            
            {/* Status Fields */}
            <tr 
              className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
              onClick={() => toggleSection('status')}
            >
              <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                <div className="flex items-center justify-between">
                  <span>STATUS FIELDS</span>
                  <span className="text-xs">{expandedSections.status ? '▼' : '▶'}</span>
                </div>
              </td>
            </tr>
            {expandedSections.status && statusFields.map((field) => (
              <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                <td className="text-dark-text py-2 px-4">{field.label}</td>
                <td className={`py-2 px-4 ${getStatusColor(field.value, field.type)}`}>
                  {formatValue(field.value, field.type)}
                </td>
                <td className="py-2 px-4">
                  <div className={`w-2 h-2 rounded-full ${field.value ? 'bg-green-500' : 'bg-gray-600'}`} />
                </td>
              </tr>
            ))}

            {/* Counter Fields */}
            <tr 
              className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
              onClick={() => toggleSection('counter')}
            >
              <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                <div className="flex items-center justify-between">
                  <span>COUNTER FIELDS</span>
                  <span className="text-xs">{expandedSections.counter ? '▼' : '▶'}</span>
                </div>
              </td>
            </tr>
            {expandedSections.counter && counterFields.map((field) => (
              <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                <td className="text-dark-text py-2 px-4">{field.label}</td>
                <td className="text-white py-2 px-4">{formatValue(field.value, field.type)}</td>
                <td className="py-2 px-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </td>
              </tr>
            ))}

            {/* Alarm Fields */}
            <tr 
              className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
              onClick={() => toggleSection('alarm')}
            >
              <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                <div className="flex items-center justify-between">
                  <span>ALARM FIELDS</span>
                  <span className="text-xs">{expandedSections.alarm ? '▼' : '▶'}</span>
                </div>
              </td>
            </tr>
            {expandedSections.alarm && alarmFields.map((field) => (
              <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                <td className="text-dark-text py-2 px-4">{field.label}</td>
                <td className={`py-2 px-4 ${getStatusColor(field.value, field.type, true)}`}>
                  {formatValue(field.value, field.type)}
                </td>
                <td className="py-2 px-4">
                  <div className={`w-2 h-2 rounded-full ${field.value ? 'bg-red-500' : 'bg-green-500'}`} />
                </td>
              </tr>
            ))}

            {/* Analog Fields */}
            <tr 
              className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
              onClick={() => toggleSection('analog')}
            >
              <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                <div className="flex items-center justify-between">
                  <span>ANALOG FIELDS</span>
                  <span className="text-xs">{expandedSections.analog ? '▼' : '▶'}</span>
                </div>
              </td>
            </tr>
            {expandedSections.analog && analogFields.map((field) => (
              <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                <td className="text-dark-text py-2 px-4">{field.label}</td>
                <td className="text-white py-2 px-4">{formatValue(field.value, field.type, field.unit)}</td>
                <td className="py-2 px-4">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                </td>
              </tr>
            ))}

            {/* Input Fields / Safety Fields */}
            <tr 
              className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
              onClick={() => toggleSection('input')}
            >
              <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                <div className="flex items-center justify-between">
                  <span>{isLathe ? 'SAFETY FIELDS' : 'INPUT FIELDS'}</span>
                  <span className="text-xs">{expandedSections.input ? '▼' : '▶'}</span>
                </div>
              </td>
            </tr>
            {expandedSections.input && inputFields.map((field) => (
              <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                <td className="text-dark-text py-2 px-4">{field.label}</td>
                <td className={`py-2 px-4 ${getStatusColor(field.value, field.type)}`}>
                  {formatValue(field.value, field.type)}
                </td>
                <td className="py-2 px-4">
                  <div className={`w-2 h-2 rounded-full ${field.value ? 'bg-green-500' : 'bg-gray-600'}`} />
                </td>
              </tr>
            ))}

            {/* Tooling Fields (Lathe only) */}
            {isLathe && toolingFields.length > 0 && (
              <>
                <tr 
                  className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
                  onClick={() => toggleSection('tooling')}
                >
                  <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                    <div className="flex items-center justify-between">
                      <span>TOOLING FIELDS</span>
                      <span className="text-xs">{expandedSections.tooling ? '▼' : '▶'}</span>
                    </div>
                  </td>
                </tr>
                {expandedSections.tooling && toolingFields.map((field) => (
                  <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                    <td className="text-dark-text py-2 px-4">{field.label}</td>
                    <td className="text-white py-2 px-4">{formatValue(field.value, field.type, field.unit)}</td>
                    <td className="py-2 px-4">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Coolant Fields (Lathe only) */}
            {isLathe && coolantFields.length > 0 && (
              <>
                <tr 
                  className="border-b border-dark-border cursor-pointer hover:bg-midnight-300/50 transition-colors"
                  onClick={() => toggleSection('coolant')}
                >
                  <td colSpan={3} className="text-gray-400 text-sm font-semibold py-2 px-4 bg-midnight-200">
                    <div className="flex items-center justify-between">
                      <span>COOLANT FIELDS</span>
                      <span className="text-xs">{expandedSections.coolant ? '▼' : '▶'}</span>
                    </div>
                  </td>
                </tr>
                {expandedSections.coolant && coolantFields.map((field) => (
                  <tr key={field.label} className="border-b border-dark-border hover:bg-midnight-200/20">
                    <td className="text-dark-text py-2 px-4">{field.label}</td>
                    <td className="text-white py-2 px-4">{formatValue(field.value, field.type, field.unit)}</td>
                    <td className="py-2 px-4">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

