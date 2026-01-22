import React, { useState, useMemo } from 'react';
import './EmployeeWeeklyReportPage.css';

// ============================================================================
// Types
// ============================================================================

interface ActionCatalogItem {
  id: number;
  name: string;
  defaultTarget: number;
}

interface ReportLine {
  actionId: number;
  actionName: string;
  dailyTarget: number | '';
  entries: Record<string, number | ''>;
}

interface Report {
  weekStartISO: string;
  employeeId: string;
  status: 'draft' | 'submitted';
  lines: ReportLine[];
}

interface EmployeeIdentity {
  employeeId: string;
  employeeName: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const ACTIONS_CATALOG: ActionCatalogItem[] = [
  { id: 1, name: 'New Hires', defaultTarget: 4 },
  { id: 2, name: 'Interviews', defaultTarget: 9 },
  { id: 3, name: 'Call outs', defaultTarget: 1 },
  { id: 4, name: 'Replacements', defaultTarget: 1 },
  { id: 5, name: 'Site Visits', defaultTarget: 4 },
  { id: 6, name: 'Writeups', defaultTarget: 0 },
  { id: 7, name: 'Fingerprints', defaultTarget: 0 },
  { id: 8, name: 'Pay issues', defaultTarget: 0 },
  { id: 9, name: 'Terminations', defaultTarget: 0 },
];

const MOCK_EMPLOYEES: EmployeeIdentity[] = [
  { employeeId: 'emp_peyton', employeeName: 'Peyton Cizek' },
  { employeeId: 'emp_john', employeeName: 'John Doe' },
  { employeeId: 'emp_maria', employeeName: 'Maria Lopez' },
];

// ============================================================================
// Date Utilities
// ============================================================================

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, else go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function canSubmitReport(
  weekStartDate: Date,
  now: Date
): { allowed: boolean; reason: string } {
  // Week is Mon-Sun, submission allowed starting Sunday 18:00 (6 PM)
  const sunday = new Date(weekStartDate);
  sunday.setDate(sunday.getDate() + 6); // Sunday
  sunday.setHours(18, 0, 0, 0);

  if (now < sunday) {
    return {
      allowed: false,
      reason: `Submission opens Sunday at 6:00 PM`,
    };
  }

  return { allowed: true, reason: '' };
}

// ============================================================================
// Input Sanitization
// ============================================================================

function sanitizeNumberInput(value: string): number | '' {
  if (value === '') return '';
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) return '';
  return num;
}

// ============================================================================
// Component
// ============================================================================

export default function EmployeeWeeklyReportPage() {
  // DEV: Mock employee selector
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeIdentity>(MOCK_EMPLOYEES[0]);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => formatISODate(new Date()));
  
  // Store reports keyed by employeeId + weekStartISO
  const [reportsStore, setReportsStore] = useState<Record<string, Report>>({});
  
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Compute current report key
  const weekStart = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return getWeekStart(date);
  }, [selectedDate]);

  const weekStartISO = useMemo(() => formatISODate(weekStart), [weekStart]);
  const reportKey = `${currentEmployee.employeeId}_${weekStartISO}`;

  // Get or create current report
  const report = useMemo(() => {
    if (reportsStore[reportKey]) {
      return reportsStore[reportKey];
    }
    return {
      weekStartISO,
      employeeId: currentEmployee.employeeId,
      status: 'draft' as const,
      lines: [],
    };
  }, [reportsStore, reportKey, weekStartISO, currentEmployee.employeeId]);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekDatesISO = useMemo(() => weekDates.map(formatISODate), [weekDates]);

  // Helper to update report in store
  const updateReport = (updater: (prev: Report) => Report) => {
    const updated = updater(report);
    setReportsStore(prev => ({
      ...prev,
      [reportKey]: updated,
    }));
  };

  // Handle employee change
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employee = MOCK_EMPLOYEES.find(emp => emp.employeeId === e.target.value);
    if (employee) {
      setCurrentEmployee(employee);
      // Report will be loaded from store or created fresh for this employee+week
    }
  };

  // Handle date picker change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedDate(value);
    // When date changes, the computed weekStart and reportKey will update
    // and useMemo will fetch/create the appropriate report
  };

  // Add action line
  const handleAddAction = (action: ActionCatalogItem) => {
    if (report.status !== 'draft') return;
    if (report.lines.some(line => line.actionId === action.id)) {
      setValidationError(`${action.name} is already added`);
      setTimeout(() => setValidationError(''), 3000);
      return;
    }

    const newLine: ReportLine = {
      actionId: action.id,
      actionName: action.name,
      dailyTarget: action.defaultTarget,
      entries: {},
    };

    updateReport(prev => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
    setShowAddActionModal(false);
  };

  // Remove action line
  const handleRemoveAction = (actionId: number) => {
    if (report.status !== 'draft') return;
    updateReport(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.actionId !== actionId),
    }));
  };

  // Update daily target
  const handleTargetChange = (actionId: number, value: string) => {
    if (report.status !== 'draft') return;
    const sanitized = sanitizeNumberInput(value);
    updateReport(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.actionId === actionId ? { ...line, dailyTarget: sanitized } : line
      ),
    }));
  };

  // Update daily entry
  const handleEntryChange = (actionId: number, dateISO: string, value: string) => {
    if (report.status !== 'draft') return;
    const sanitized = sanitizeNumberInput(value);
    updateReport(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.actionId === actionId
          ? { ...line, entries: { ...line.entries, [dateISO]: sanitized } }
          : line
      ),
    }));
  };

  // Calculate row total
  const getRowTotal = (line: ReportLine): number => {
    return Object.values(line.entries).reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  };

  // Calculate weekly total
  const weeklyTotal = useMemo(() => {
    return report.lines.reduce((sum, line) => sum + getRowTotal(line), 0);
  }, [report.lines]);

  // Check if can submit
  const submitCheck = useMemo(() => {
    return canSubmitReport(weekStart, new Date());
  }, [weekStart]);

  const canSubmit =
    report.status === 'draft' &&
    report.lines.length > 0 &&
    submitCheck.allowed;

  // Handle submit
  const handleSubmit = () => {
    if (!canSubmit) return;
    updateReport(prev => ({ ...prev, status: 'submitted' }));
  };

  // Available actions for adding
  const availableActions = ACTIONS_CATALOG.filter(
    action => !report.lines.some(line => line.actionId === action.id)
  );

  const isReadOnly = report.status === 'submitted';

  return (
    <div className="employee-report-page">
      <div className="report-header">
        <div className="header-title-section">
          <h1>Weekly Production Report</h1>
          <div className="employee-info">
            Employee: <strong>{currentEmployee.employeeName}</strong>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="employee-selector-container dev-only">
            <label htmlFor="employee-selector">DEV - Employee:</label>
            <select
              id="employee-selector"
              value={currentEmployee.employeeId}
              onChange={handleEmployeeChange}
              disabled={isReadOnly}
            >
              {MOCK_EMPLOYEES.map(emp => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="date-picker-container">
            <label htmlFor="week-selector">Select Date:</label>
            <input
              id="week-selector"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              disabled={isReadOnly}
            />
          </div>
        </div>
        
        <div className="header-status">
          <div className="week-info">
            <div className="week-range">
              Week: {formatDisplayDate(weekDates[0])} – {formatDisplayDate(weekDates[6])}
            </div>
            <div className="week-debug">
              Week Start: {weekStartISO} (Monday)
            </div>
          </div>
          <div className="status-badge" data-status={report.status}>
            {report.status === 'draft' ? 'Draft' : 'Submitted'}
          </div>
        </div>
      </div>

      {validationError && (
        <div className="validation-error">{validationError}</div>
      )}

      <div className="report-content">
        {!isReadOnly && (
          <div className="actions-toolbar">
            <button
              className="btn-add-action"
              onClick={() => setShowAddActionModal(true)}
              disabled={availableActions.length === 0}
            >
              + Add Action
            </button>
            {availableActions.length === 0 && (
              <span className="hint-text">All actions added</span>
            )}
          </div>
        )}

        {report.lines.length === 0 ? (
          <div className="empty-state">
            <p>No actions added yet. Click "+ Add Action" to get started.</p>
          </div>
        ) : (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="col-action">Action</th>
                  <th className="col-target">Daily Target</th>
                  {weekDates.map((date, idx) => (
                    <th key={idx} className="col-day">
                      <div className="day-header">
                        <div className="day-name">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                        </div>
                        <div className="day-date">{formatDisplayDate(date)}</div>
                      </div>
                    </th>
                  ))}
                  <th className="col-total">Row Total</th>
                  {!isReadOnly && <th className="col-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {report.lines.map(line => {
                  const rowTotal = getRowTotal(line);
                  return (
                    <tr key={line.actionId}>
                      <td className="col-action">{line.actionName}</td>
                      <td className="col-target">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.dailyTarget}
                          onChange={e => handleTargetChange(line.actionId, e.target.value)}
                          disabled={isReadOnly}
                          className="input-number"
                        />
                      </td>
                      {weekDatesISO.map(dateISO => (
                        <td key={dateISO} className="col-day">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.entries[dateISO] ?? ''}
                            onChange={e => handleEntryChange(line.actionId, dateISO, e.target.value)}
                            disabled={isReadOnly}
                            className="input-number"
                            placeholder="-"
                          />
                        </td>
                      ))}
                      <td className="col-total">
                        <strong>{rowTotal}</strong>
                      </td>
                      {!isReadOnly && (
                        <td className="col-actions">
                          <button
                            className="btn-remove"
                            onClick={() => handleRemoveAction(line.actionId)}
                            title="Remove action"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={isReadOnly ? 9 : 10} className="footer-total">
                    <strong>Weekly Total: {weeklyTotal}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="submit-section">
          {!submitCheck.allowed && (
            <div className="submit-info">{submitCheck.reason}</div>
          )}
          {report.lines.length === 0 && report.status === 'draft' && (
            <div className="submit-info">Add at least one action to submit</div>
          )}
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit Report
          </button>
        </div>
      </div>

      {/* Add Action Modal */}
      {showAddActionModal && (
        <div className="modal-overlay" onClick={() => setShowAddActionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Action</h2>
              <button
                className="btn-close-modal"
                onClick={() => setShowAddActionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ul className="action-list">
                {availableActions.map(action => (
                  <li key={action.id}>
                    <button
                      className="action-item"
                      onClick={() => handleAddAction(action)}
                    >
                      <span className="action-name">{action.name}</span>
                      <span className="action-target">
                        Default target: {action.defaultTarget}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {availableActions.length === 0 && (
                <p className="no-actions">All actions have been added.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
