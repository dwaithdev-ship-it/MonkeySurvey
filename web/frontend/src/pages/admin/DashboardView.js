import React, { useState, useMemo, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    Title
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title);

const COLORS = [
    '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#4f46e5'
];

function DashboardView({ survey, responses }) {
    const [targetQuestionId, setTargetQuestionId] = useState(survey.questions[0]?._id);
    const [filters, setFilters] = useState([]); // Array of { questionId, value }

    // Effect to set initial target question if it exists
    useEffect(() => {
        if (survey.questions.length > 0 && !targetQuestionId) {
            setTargetQuestionId(survey.questions[0]._id);
        }
    }, [survey, targetQuestionId]);

    const targetQuestion = useMemo(() =>
        survey.questions.find(q => q._id === targetQuestionId),
        [survey, targetQuestionId]);

    // Apply filters to responses
    const filteredResponses = useMemo(() => {
        return responses.filter(resp => {
            return filters.every(filter => {
                const answer = resp.answers.find(a => a.questionId === filter.questionId);
                if (!answer) return false;

                if (Array.isArray(answer.value)) {
                    return answer.value.includes(filter.value);
                }
                return answer.value === filter.value;
            });
        });
    }, [responses, filters]);

    // Calculate chart data
    const chartData = useMemo(() => {
        if (!targetQuestion) return null;

        const counts = {};

        // Initialize counts for all options if they exist
        if (targetQuestion.options && targetQuestion.options.length > 0) {
            targetQuestion.options.forEach(opt => {
                counts[opt.label || opt.value] = 0;
            });
        }

        filteredResponses.forEach(resp => {
            const answer = resp.answers.find(a => a.questionId === targetQuestionId);
            if (!answer) return;

            const val = answer.value;

            if (Array.isArray(val)) {
                val.forEach(v => {
                    const label = targetQuestion.options?.find(o => o.value === v)?.label || v;
                    counts[label] = (counts[label] || 0) + 1;
                });
            } else {
                const label = targetQuestion.options?.find(o => o.value === val)?.label || val;
                counts[label] = (counts[label] || 0) + 1;
            }
        });

        const labels = Object.keys(counts);
        const data = Object.values(counts);

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: COLORS.slice(0, labels.length),
                    borderColor: 'white',
                    borderWidth: 2,
                    hoverOffset: 15
                },
            ],
        };
    }, [filteredResponses, targetQuestion, targetQuestionId]);

    const addFilter = (qId, val) => {
        if (!qId || !val) return;
        setFilters([...filters, { questionId: qId, value: val }]);
    };

    const removeFilter = (index) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const getQuestionLabel = (id) => survey.questions.find(q => q._id === id)?.question || 'Unknown';

    return (
        <div style={styles.dashboard}>
            <div style={styles.sidebar}>
                <h3 style={styles.sectionTitle}>Query Builder</h3>

                <div style={styles.controlGroup}>
                    <label style={styles.label}>Visualize Data For:</label>
                    <select
                        style={styles.select}
                        value={targetQuestionId}
                        onChange={(e) => setTargetQuestionId(e.target.value)}
                    >
                        {survey.questions.map(q => (
                            <option key={q._id} value={q._id}>{q.question}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.divider} />

                <h4 style={styles.subTitle}>Active Filters</h4>
                <div style={styles.filterList}>
                    {filters.length === 0 && <p style={styles.emptyText}>No filters applied</p>}
                    {filters.map((f, i) => (
                        <div key={i} style={styles.filterBadge}>
                            <span style={styles.filterText}>
                                <strong>{getQuestionLabel(f.questionId)}:</strong> {f.value}
                            </span>
                            <button onClick={() => removeFilter(i)} style={styles.removeBtn}>×</button>
                        </div>
                    ))}
                </div>

                <div style={styles.divider} />

                <h4 style={styles.subTitle}>Add New Filter</h4>
                <FilterForm survey={survey} onAdd={addFilter} />
            </div>

            <div style={styles.mainContent}>
                <div style={styles.statsRow}>
                    <StatCard label="Total Responses" value={responses.length} color="#6366f1" />
                    <StatCard label="Filtered Results" value={filteredResponses.length} color="#10b981" />
                    <StatCard
                        label="Sample Size"
                        value={`${Math.round((filteredResponses.length / responses.length) * 100 || 0)}%`}
                        color="#f59e0b"
                    />
                </div>

                <div style={styles.chartArea}>
                    <div style={styles.chartCard}>
                        <h2 style={styles.chartTitle}>{targetQuestion?.question}</h2>
                        <div style={styles.chartWrapper}>
                            {chartData && chartData.labels.length > 0 ? (
                                <Doughnut
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom' },
                                            tooltip: {
                                                padding: 12,
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                titleFont: { size: 14 },
                                                bodyFont: { size: 14 }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={styles.noData}>No data matches these criteria</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterForm({ survey, onAdd }) {
    const [qId, setQId] = useState('');
    const [val, setVal] = useState('');

    const question = survey.questions.find(q => q._id === qId);

    return (
        <div style={styles.filterForm}>
            <select
                style={styles.selectSmall}
                value={qId}
                onChange={(e) => { setQId(e.target.value); setVal(''); }}
            >
                <option value="">Select Question...</option>
                {survey.questions.map(q => (
                    <option key={q._id} value={q._id}>{q.question}</option>
                ))}
            </select>

            {question && question.options && question.options.length > 0 ? (
                <select
                    style={styles.selectSmall}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                >
                    <option value="">Select Option...</option>
                    {question.options.map(opt => (
                        <option key={opt._id} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : qId ? (
                <input
                    style={styles.input}
                    placeholder="Type value..."
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                />
            ) : null}

            <button
                onClick={() => { onAdd(qId, val); setQId(''); setVal(''); }}
                disabled={!qId || !val}
                style={{
                    ...styles.addBtn,
                    opacity: (!qId || !val) ? 0.5 : 1
                }}
            >
                Add Filter
            </button>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
            <p style={styles.statLabel}>{label}</p>
            <h2 style={{ ...styles.statValue, color }}>{value}</h2>
        </div>
    );
}

const styles = {
    dashboard: {
        display: 'flex',
        gap: '24px',
        padding: '24px 0',
        animation: 'fadeIn 0.5s ease-out'
    },
    sidebar: {
        width: '320px',
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        height: 'fit-content'
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '20px',
        color: '#111827'
    },
    controlGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: '8px'
    },
    select: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer'
    },
    selectSmall: {
        width: '100%',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        marginBottom: '8px'
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        marginBottom: '8px',
        boxSizing: 'border-box'
    },
    divider: {
        height: '1px',
        background: '#f3f4f6',
        margin: '20px 0'
    },
    subTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
    },
    filterBadge: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f3f4f6',
        padding: '8px 12px',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    filterText: {
        fontSize: '12px',
        color: '#4b5563',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '220px'
    },
    removeBtn: {
        border: 'none',
        background: 'none',
        color: '#9ca3af',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '0 4px'
    },
    emptyText: {
        fontSize: '13px',
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center'
    },
    addBtn: {
        width: '100%',
        padding: '10px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '20px'
    },
    statCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    statLabel: {
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '8px'
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '800'
    },
    chartArea: {
        background: 'white',
        padding: '30px',
        borderRadius: '24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    chartTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '30px',
        textAlign: 'center'
    },
    chartWrapper: {
        flex: 1,
        minHeight: '400px',
        position: 'relative'
    },
    noData: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#9ca3af',
        fontSize: '16px',
        fontWeight: '500'
    }
};

export default DashboardView;
