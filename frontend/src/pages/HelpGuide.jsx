import React, { useState, useEffect } from 'react';
import Layout from './layout';
import './HelpGuide.css';

const faqsData = [
  {
    category: "General",
    questions: [
      {
        question: "What is Bodha Survey?",
        answer: "Bodha Survey is a comprehensive application for building, distributing, and analyzing surveys seamlessly, with support for offline data collection."
      },
      {
        question: "How much does it cost?",
        answer: "Please navigate to the Purchase History section or contact our pricing team to learn more about the subscription packages."
      }
    ]
  },
  {
    category: "Survey Usage",
    questions: [
      {
        question: "How do I create a new survey?",
        answer: "Navigate to the 'Surveys' tab from the dashboard and click the 'Create Survey' button. You can use our drag-and-drop builder to add questions."
      },
      {
        question: "Can I customize the look of my survey?",
        answer: "Yes, you can use the 'Themes' page to define colors, background images, and fonts for your survey."
      }
    ]
  },
  {
    category: "Data Collection & Offline Mode",
    questions: [
      {
        question: "Can surveys work offline?",
        answer: "Yes. Once a survey is assigned to a device, the questions are cached locally. Data collected offline is stored locally and will sync automatically when an internet connection is restored."
      },
      {
        question: "How is data secured?",
        answer: "All sensitive survey data and user information are encrypted and securely stored on the server with strict access controls."
      }
    ]
  },
  {
    category: "Account & Devices",
    questions: [
      {
        question: "How do I register a device?",
        answer: "Devices are automatically registered the first time a user logs into a survey on their mobile device or browser."
      },
      {
        question: "Can an admin block a compromised device?",
        answer: "Yes. An administrator can go to the 'Devices' page and click 'Block' on any device to instantly revoke its access to the survey system."
      }
    ]
  }
];

export default function HelpGuide() {
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const toggleAccordion = (index) => {
        if (openIndex === index) {
            setOpenIndex(null);
        } else {
            setOpenIndex(index);
        }
    };

    // Filter FAQs based on search
    const filteredCategories = faqsData.map(category => {
        const term = searchTerm.toLowerCase();
        const filteredQuestions = category.questions.filter(q => 
            q.question.toLowerCase().includes(term) || q.answer.toLowerCase().includes(term)
        );
        return {
            ...category,
            questions: filteredQuestions
        };
    }).filter(category => category.questions.length > 0);

    let globalIndex = 0; // Used to ensure unique index for accordion toggling across categories

    return (
        <Layout user={user || {}}>
            <div className="help-guide-container">
                <div className="help-header">
                    <h2>Help Guide & FAQ</h2>
                    <p>Find answers to common questions about using Bodha Survey.</p>
                </div>

                <div className="help-controls">
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input help-search"
                    />
                </div>

                <div className="faq-content">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category, catIdx) => (
                            <div key={catIdx} className="faq-category">
                                <h3>{category.category}</h3>
                                <div className="faq-list">
                                    {category.questions.map((q) => {
                                        const currentIndex = globalIndex++;
                                        const isOpen = openIndex === currentIndex;
                                        return (
                                            <div 
                                                key={currentIndex} 
                                                className={`faq-item ${isOpen ? 'open' : ''}`}
                                            >
                                                <div 
                                                    className="faq-question" 
                                                    onClick={() => toggleAccordion(currentIndex)}
                                                >
                                                    <h4>{q.question}</h4>
                                                    <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                                                </div>
                                                <div className="faq-answer-wrapper" style={{ height: isOpen ? 'auto' : '0px', overflow: 'hidden' }}>
                                                    <div className="faq-answer">
                                                        <p>{q.answer}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No matching questions found for "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
