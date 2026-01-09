/**
 * Event Reminder Tool - Production Application
 * 
 * Architecture:
 * - State Management: Central state store with LocalStorage persistence
 * - UI Rendering: Reactive updates based on state changes
 * - Event Handling: Modular handlers for user interactions
 */

// ===========================
// Theme Management
// ===========================

/**
 * Theme manager for dark/light mode
 */
const ThemeManager = {
    STORAGE_KEY: 'eventReminder_theme',
    currentTheme: 'light',

    /**
     * Initialize theme from storage or system preference
     */
    init() {
        // Check localStorage first
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        this.applyTheme();
        return this;
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    },

    /**
     * Toggle between light and dark mode
     */
    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
    }
};

// ===========================
// Email Service
// ===========================

/**
 * Email service manager using EmailJS
 * Sends notifications when events are added or when events occur
 */
const EmailService = {
    // EmailJS Configuration
    // You need to set up a free account at https://www.emailjs.com/
    // and replace these with your actual credentials
    SERVICE_ID: 'service_fn4woi6',  // Replace with your EmailJS service ID
    TEMPLATE_ID_NEW_EVENT: 'template_vk9bqqt',  // Replace with your template ID for new events
    TEMPLATE_ID_REMINDER: 'template_54dvjbj',  // Replace with your template ID for reminders
    PUBLIC_KEY: '2Ln0CgKlxEsOB0SzA',  // Replace with your EmailJS public key
    RECIPIENT_EMAIL: 'gunjabhatt122006@gmail.com',

    /**
     * Initialize EmailJS
     */
    init() {
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init(this.PUBLIC_KEY);
                console.log('✅ EmailJS initialized successfully');
                console.log('Service ID:', this.SERVICE_ID);
                console.log('Public Key:', this.PUBLIC_KEY.substring(0, 5) + '...');
                console.log('Recipient:', this.RECIPIENT_EMAIL);
                return true;
            } catch (error) {
                console.error('❌ EmailJS initialization failed:', error);
                return false;
            }
        } else {
            console.error('❌ EmailJS library not loaded!');
            console.error('Please check:');
            console.error('1. Internet connection is active');
            console.error('2. CDN is not blocked by firewall/antivirus');
            console.error('3. Browser console for network errors');
            return false;
        }
    },

    /**
     * Send email notification when a new event is added
     */
    async sendNewEventNotification(eventData) {
        console.log('Attempting to send email for new event:', eventData);
        
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS library not loaded. Make sure the script is included in HTML.');
            return false;
        }

        try {
            // Format date manually if DateUtils not available yet
            let formattedDate = eventData.date;
            if (typeof DateUtils !== 'undefined' && DateUtils.formatDateLong) {
                formattedDate = DateUtils.formatDateLong(eventData.date);
            } else {
                // Fallback formatting
                const date = new Date(eventData.date + 'T00:00:00');
                formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            const templateParams = {
                to_email: this.RECIPIENT_EMAIL,
                event_title: eventData.title,
                event_date: formattedDate,
                event_description: eventData.description || 'No description provided',
                notification_type: 'New Event Added'
            };

            console.log('Sending email with params:', templateParams);

            const response = await emailjs.send(
                this.SERVICE_ID,
                this.TEMPLATE_ID_NEW_EVENT,
                templateParams
            );

            console.log('✅ New event email sent successfully:', response);
            return true;
        } catch (error) {
            console.error('❌ Failed to send new event email:', error);
            console.error('Error details:', error.text || error.message);
            return false;
        }
    },

    /**
     * Send reminder email when event time arrives
     */
    async sendEventReminder(eventData) {
        console.log('Attempting to send reminder for event:', eventData);
        
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS library not loaded. Make sure the script is included in HTML.');
            return false;
        }

        try {
            // Format date manually if DateUtils not available yet
            let formattedDate = eventData.date;
            if (typeof DateUtils !== 'undefined' && DateUtils.formatDateLong) {
                formattedDate = DateUtils.formatDateLong(eventData.date);
            } else {
                // Fallback formatting
                const date = new Date(eventData.date + 'T00:00:00');
                formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            const templateParams = {
                to_email: this.RECIPIENT_EMAIL,
                event_title: eventData.title,
                event_date: formattedDate,
                event_description: eventData.description || 'No description provided',
                notification_type: 'Event Reminder'
            };

            console.log('Sending reminder email with params:', templateParams);

            const response = await emailjs.send(
                this.SERVICE_ID,
                this.TEMPLATE_ID_REMINDER,
                templateParams
            );

            console.log('✅ Event reminder email sent successfully:', response);
            return true;
        } catch (error) {
            console.error('❌ Failed to send reminder email:', error);
            console.error('Error details:', error.text || error.message);
            return false;
        }
    },

    /**
     * Check and send reminders for events happening today
     */
    checkAndSendReminders() {
        const events = StateManager.getSortedEvents();
        const today = DateUtils.getToday();

        events.forEach(event => {
            const eventDate = DateUtils.parseDate(event.date);
            
            // Check if event is today and hasn't been reminded yet
            if (DateUtils.isToday(event.date)) {
                // Check if we've already sent a reminder for this event today
                const reminderKey = `reminder_sent_${event.id}_${today.toISOString().split('T')[0]}`;
                const reminderSent = localStorage.getItem(reminderKey);

                if (!reminderSent) {
                    this.sendEventReminder(event);
                    // Mark reminder as sent
                    localStorage.setItem(reminderKey, 'true');
                }
            }
        });
    }
};

// ===========================
// State Management
// ===========================

/**
 * Application state manager
 * Handles all state operations and persistence
 */
const StateManager = {
    STORAGE_KEY: 'eventReminder_events',
    events: [],

    /**
     * Initialize state from LocalStorage
     */
    init() {
        this.loadFromStorage();
        return this;
    },

    /**
     * Load events from LocalStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.events = stored ? JSON.parse(stored) : [];
            // Ensure all events have valid structure
            this.events = this.events.map(event => ({
                id: event.id || this.generateId(),
                title: event.title || 'Untitled Event',
                date: event.date,
                description: event.description || '',
                createdAt: event.createdAt || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.events = [];
        }
    },

    /**
     * Save events to LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    },

    /**
     * Generate unique ID for events
     */
    generateId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Add new event to state
     */
    addEvent(eventData) {
        const newEvent = {
            id: this.generateId(),
            title: eventData.title.trim(),
            date: eventData.date,
            description: eventData.description.trim(),
            createdAt: new Date().toISOString()
        };

        this.events.push(newEvent);
        this.saveToStorage();
        return newEvent;
    },

    /**
     * Delete event from state
     */
    deleteEvent(eventId) {
        const index = this.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            this.events.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    },

    /**
     * Get all events sorted by date (ascending)
     */
    getSortedEvents() {
        return [...this.events].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
    },

    /**
     * Get event count
     */
    getEventCount() {
        return this.events.length;
    },

    /**
     * Update existing event
     */
    updateEvent(eventId, eventData) {
        const index = this.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            this.events[index] = {
                ...this.events[index],
                title: eventData.title.trim(),
                date: eventData.date,
                description: eventData.description.trim()
            };
            this.saveToStorage();
            return this.events[index];
        }
        return null;
    },

    /**
     * Get event by ID
     */
    getEventById(eventId) {
        return this.events.find(event => event.id === eventId);
    }
};

// ===========================
// Date Utilities
// ===========================

/**
 * Date utility functions
 */
const DateUtils = {
    /**
     * Get today's date at midnight
     */
    getToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    },

    /**
     * Parse date string to Date object at midnight
     */
    parseDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date;
    },

    /**
     * Check if a date is today
     */
    isToday(date) {
        const today = this.getToday();
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate.getTime() === today.getTime();
    },

    /**
     * Check if a date is in the past
     */
    isPast(date) {
        const today = this.getToday();
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate < today;
    },

    /**
     * Check if a date is within next 7 days (not including today)
     */
    isUpcoming(date) {
        const today = this.getToday();
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);
        
        return compareDate > today && compareDate <= sevenDaysLater;
    },

    /**
     * Get event status (today, upcoming, past, future)
     */
    getEventStatus(date) {
        if (this.isToday(date)) return 'today';
        if (this.isPast(date)) return 'past';
        if (this.isUpcoming(date)) return 'upcoming';
        return 'future';
    },

    /**
     * Format date for display (e.g., "January 8, 2026")
     */
    formatDateLong(dateString) {
        const date = this.parseDate(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format date as relative string (e.g., "Today", "Tomorrow", "In 3 days")
     */
    formatDateRelative(dateString) {
        const date = this.parseDate(dateString);
        const today = this.getToday();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
        if (diffDays > 1) return `In ${diffDays} days`;
        
        return this.formatDateLong(dateString);
    },

    /**
     * Calculate countdown to event
     * Returns object with days, hours, minutes, seconds
     */
    getCountdown(dateString) {
        const eventDate = this.parseDate(dateString);
        const now = new Date();
        const diff = eventDate - now;

        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isPast: false };
    },

    /**
     * Format countdown as human-readable string
     */
    formatCountdown(countdown) {
        if (countdown.isPast) {
            return 'Event has passed';
        }

        const parts = [];
        if (countdown.days > 0) parts.push(`${countdown.days}d`);
        if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}h`);
        if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) {
            parts.push(`${countdown.minutes}m`);
        }
        parts.push(`${countdown.seconds}s`);

        return parts.join(' ');
    }
};

// ===========================
// UI Renderer
// ===========================

/**
 * Notification system for user feedback
 */
const NotificationManager = {
    /**
     * Show notification message
     */
    show(type, title, message, duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = type === 'success' ? '✓' : '✕';
        
        notification.innerHTML = `
            <span class="notification-icon" aria-hidden="true">${icon}</span>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    success(title, message) {
        this.show('success', title, message);
    },

    error(title, message) {
        this.show('error', title, message);
    }
};

/**
 * UI rendering manager
 * Handles all DOM updates
 */
const UIRenderer = {
    elements: {},
    editMode: false,
    editingEventId: null,

    /**
     * Cache DOM elements
     */
    init() {
        this.elements = {
            eventForm: document.getElementById('eventForm'),
            eventTitle: document.getElementById('eventTitle'),
            eventDate: document.getElementById('eventDate'),
            eventDescription: document.getElementById('eventDescription'),
            titleError: document.getElementById('titleError'),
            dateError: document.getElementById('dateError'),
            charCount: document.querySelector('.char-count'),
            eventsList: document.getElementById('eventsList'),
            emptyState: document.getElementById('emptyState'),
            eventCount: document.getElementById('eventCount')
        };

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        this.elements.eventDate.min = today;

        return this;
    },

    /**
     * Render all events
     */
    renderEvents() {
        const events = StateManager.getSortedEvents();
        
        // Update event count
        this.updateEventCount(events.length);

        // Show/hide empty state
        if (events.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
            this.elements.eventsList.innerHTML = '';
            return;
        }

        this.elements.emptyState.classList.add('hidden');

        // Render event cards
        this.elements.eventsList.innerHTML = events
            .map(event => this.createEventCard(event))
            .join('');

        // Initialize countdowns for upcoming events
        this.updateAllCountdowns();
    },

    /**
     * Create HTML for single event card
     */
    createEventCard(event) {
        const status = DateUtils.getEventStatus(event.date);
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const dateFormatted = DateUtils.formatDateLong(event.date);
        const dateRelative = DateUtils.formatDateRelative(event.date);

        return `
            <article class="event-card ${status}" role="listitem" data-event-id="${event.id}">
                <div class="event-header">
                    <h3 class="event-title">${this.escapeHtml(event.title)}</h3>
                    <span class="event-status ${status}">${statusLabel}</span>
                </div>
                
                <div class="event-date" title="${dateFormatted}">
                    ${dateRelative}
                </div>
                
                ${event.description ? `
                    <p class="event-description">${this.escapeHtml(event.description)}</p>
                ` : ''}
                
                ${status !== 'past' ? `
                    <div class="event-countdown" data-countdown="${event.date}">
                        <span class="countdown-text">Calculating...</span>
                    </div>
                ` : ''}
                
                <div class="event-actions">
                    <button 
                        class="btn btn-edit" 
                        onclick="EventHandlers.handleEdit('${event.id}')"
                        aria-label="Edit event: ${this.escapeHtml(event.title)}"
                    >
                        Edit
                    </button>
                    <button 
                        class="btn btn-delete" 
                        onclick="EventHandlers.handleDelete('${event.id}')"
                        aria-label="Delete event: ${this.escapeHtml(event.title)}"
                    >
                        Delete
                    </button>
                </div>
            </article>
        `;
    },

    /**
     * Update event count display
     */
    updateEventCount(count) {
        const text = count === 1 ? '1 event' : `${count} events`;
        this.elements.eventCount.textContent = text;
    },

    /**
     * Update all countdown timers
     */
    updateAllCountdowns() {
        const countdownElements = document.querySelectorAll('[data-countdown]');
        
        countdownElements.forEach(element => {
            const date = element.dataset.countdown;
            const countdown = DateUtils.getCountdown(date);
            const formattedCountdown = DateUtils.formatCountdown(countdown);
            
            const textElement = element.querySelector('.countdown-text');
            if (textElement) {
                textElement.textContent = formattedCountdown;
            }
        });
    },

    /**
     * Clear form inputs
     */
    clearForm() {
        this.elements.eventForm.reset();
        this.clearErrors();
        this.updateCharCount();
    },

    /**
     * Display validation errors
     */
    showError(field, message) {
        const errorElement = this.elements[`${field}Error`];
        if (errorElement) {
            errorElement.textContent = message;
        }
    },

    /**
     * Clear all validation errors
     */
    clearErrors() {
        this.elements.titleError.textContent = '';
        this.elements.dateError.textContent = '';
    },

    /**
     * Update character count for description
     */
    updateCharCount() {
        const length = this.elements.eventDescription.value.length;
        const max = this.elements.eventDescription.maxLength;
        this.elements.charCount.textContent = `${length} / ${max}`;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Populate form with event data for editing
     */
    populateFormForEdit(event) {
        this.editMode = true;
        this.editingEventId = event.id;
        
        this.elements.eventTitle.value = event.title;
        this.elements.eventDate.value = event.date;
        this.elements.eventDescription.value = event.description;
        this.updateCharCount();
        
        // Update form UI for edit mode
        const formSection = document.querySelector('.add-event-section h2');
        if (formSection) {
            formSection.textContent = 'Edit Event';
        }
        
        const buttonGroup = this.elements.eventForm.querySelector('.form-buttons');
        if (buttonGroup) {
            buttonGroup.innerHTML = `
                <button type="button" class="btn btn-cancel" id="cancelEdit">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                    <span aria-hidden="true">✓</span> Update Event
                </button>
            `;
            
            // Attach cancel handler
            const cancelButton = document.getElementById('cancelEdit');
            if (cancelButton) {
                cancelButton.onclick = () => EventHandlers.handleCancelEdit();
            }
        }
        
        // Scroll to form
        this.elements.eventForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.elements.eventTitle.focus();
    },

    /**
     * Reset form to add mode
     */
    resetToAddMode() {
        this.editMode = false;
        this.editingEventId = null;
        
        const formSection = document.querySelector('.add-event-section h2');
        if (formSection) {
            formSection.textContent = 'Add New Event';
        }
        
        const buttonGroup = this.elements.eventForm.querySelector('.form-buttons');
        if (buttonGroup) {
            buttonGroup.innerHTML = `
                <button type="submit" class="btn btn-primary">
                    <span aria-hidden="true">+</span> Add Event
                </button>
            `;
        }
    }
};

// ===========================
// Form Validation
// ===========================

/**
 * Form validation utilities
 */
const FormValidator = {
    /**
     * Validate event title
     */
    validateTitle(title) {
        if (!title || title.trim().length === 0) {
            return { valid: false, message: 'Event title is required' };
        }
        if (title.trim().length < 3) {
            return { valid: false, message: 'Event title must be at least 3 characters' };
        }
        if (title.trim().length > 100) {
            return { valid: false, message: 'Event title must not exceed 100 characters' };
        }
        return { valid: true, message: '' };
    },

    /**
     * Validate event date
     */
    validateDate(dateString) {
        if (!dateString) {
            return { valid: false, message: 'Event date is required' };
        }

        const selectedDate = DateUtils.parseDate(dateString);
        
        if (isNaN(selectedDate.getTime())) {
            return { valid: false, message: 'Invalid date format' };
        }

        // Allow past dates but warn user
        // No restriction on past dates for flexibility

        return { valid: true, message: '' };
    },

    /**
     * Validate entire form
     */
    validateForm(formData) {
        const errors = {};
        let isValid = true;

        // Validate title
        const titleValidation = this.validateTitle(formData.title);
        if (!titleValidation.valid) {
            errors.title = titleValidation.message;
            isValid = false;
        }

        // Validate date
        const dateValidation = this.validateDate(formData.date);
        if (!dateValidation.valid) {
            errors.date = dateValidation.message;
            isValid = false;
        }

        return { isValid, errors };
    }
};

// ===========================
// Event Handlers
// ===========================

/**
 * User interaction handlers
 */
const EventHandlers = {
    /**
     * Handle form submission
     */
    handleSubmit(event) {
        event.preventDefault();
        
        UIRenderer.clearErrors();

        // Get form data
        const formData = {
            title: UIRenderer.elements.eventTitle.value,
            date: UIRenderer.elements.eventDate.value,
            description: UIRenderer.elements.eventDescription.value
        };

        // Validate form
        const validation = FormValidator.validateForm(formData);

        if (!validation.isValid) {
            // Display errors
            if (validation.errors.title) {
                UIRenderer.showError('title', validation.errors.title);
            }
            if (validation.errors.date) {
                UIRenderer.showError('date', validation.errors.date);
            }
            return;
        }

        // Check if in edit mode
        if (UIRenderer.editMode && UIRenderer.editingEventId) {
            // Update existing event
            StateManager.updateEvent(UIRenderer.editingEventId, formData);
            
            NotificationManager.success(
                'Event Updated!',
                `"${formData.title}" has been updated successfully`
            );
            
            UIRenderer.resetToAddMode();
        } else {
            // Add new event
            const newEvent = StateManager.addEvent(formData);
            
            // Send email notification for new event
            EmailService.sendNewEventNotification(newEvent)
                .then(success => {
                    if (success) {
                        console.log('✅ Email notification sent successfully');
                    } else {
                        console.warn('⚠️ Email notification failed to send');
                    }
                })
                .catch(error => {
                    console.error('⚠️ Email notification error:', error);
                });
            
            NotificationManager.success(
                'Event Added!',
                `"${formData.title}" has been added to your events`
            );
        }

        // Clear form
        UIRenderer.clearForm();

        // Re-render events list
        UIRenderer.renderEvents();

        // Focus back to title input for better UX
        UIRenderer.elements.eventTitle.focus();
    },

    /**
     * Handle event deletion
     */
    handleDelete(eventId) {
        // Confirm deletion
        const confirmed = confirm('Are you sure you want to delete this event?');
        
        if (confirmed) {
            const deleted = StateManager.deleteEvent(eventId);
            if (deleted) {
                NotificationManager.success(
                    'Event Deleted',
                    'The event has been removed from your list'
                );
            }
            UIRenderer.renderEvents();
        }
    },

    /**
     * Handle character count update
     */
    handleDescriptionInput() {
        UIRenderer.updateCharCount();
    },

    /**
     * Handle event editing
     */
    handleEdit(eventId) {
        const event = StateManager.getEventById(eventId);
        if (event) {
            UIRenderer.populateFormForEdit(event);
        }
    },

    /**
     * Handle cancel edit
     */
    handleCancelEdit() {
        UIRenderer.resetToAddMode();
        UIRenderer.clearForm();
        UIRenderer.elements.eventTitle.focus();
    }
};

// ===========================
// Countdown Timer Manager
// ===========================

/**
 * Manages live countdown updates
 */
const CountdownManager = {
    intervalId: null,

    /**
     * Start countdown interval
     */
    start() {
        // Update immediately
        UIRenderer.updateAllCountdowns();

        // Update every second
        this.intervalId = setInterval(() => {
            UIRenderer.updateAllCountdowns();
            
            // Check if day has changed and re-render if needed
            this.checkDayChange();
        }, 1000);
    },

    /**
     * Stop countdown interval
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Check if day has changed and trigger re-render
     * This ensures event status (today/upcoming/past) stays accurate
     */
    lastCheckedDate: null,
    
    checkDayChange() {
        const currentDate = new Date().toDateString();
        
        if (this.lastCheckedDate && this.lastCheckedDate !== currentDate) {
            // Day has changed, re-render everything
            UIRenderer.renderEvents();
        }
        
        this.lastCheckedDate = currentDate;
    }
};

// Expose EventHandlers to global scope for inline event handlers
window.EventHandlers = EventHandlers;

// ===========================
// Tab Management
// ===========================

const TabManager = {
    currentTab: 'dashboard',

    init() {
        console.log('TabManager initializing...');
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Found tab buttons:', tabButtons.length);
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.dataset.tab;
                console.log('Tab clicked:', tabName);
                this.switchTab(tabName);
            });
        });
        
        // Load saved tab preference
        const savedTab = localStorage.getItem('eventReminder_currentTab');
        if (savedTab) {
            console.log('Loading saved tab:', savedTab);
            this.switchTab(savedTab);
        } else {
            console.log('No saved tab, using dashboard');
        }
    },

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        this.currentTab = tabName;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            const isActive = content.id === `${tabName}-tab`;
            content.classList.toggle('active', isActive);
            console.log(`${content.id} active:`, isActive);
        });
        
        // Save preference
        localStorage.setItem('eventReminder_currentTab', tabName);
        
        // Refresh content for specific tabs
        if (tabName === 'dashboard') {
            DashboardManager.update();
        } else if (tabName === 'calendar') {
            CalendarManager.render();
        } else if (tabName === 'categories') {
            CategoryManager.render();
        }
    }
};

// ===========================
// Dashboard Manager
// ===========================

const DashboardManager = {
    update() {
        const events = StateManager.getSortedEvents();
        const today = DateUtils.getToday();
        
        // Calculate stats
        const total = events.length;
        const upcoming = events.filter(e => DateUtils.isUpcoming(e.date)).length;
        const todayEvents = events.filter(e => DateUtils.isToday(e.date)).length;
        const past = events.filter(e => DateUtils.isPast(e.date)).length;
        
        // Update stat cards
        document.getElementById('totalEvents').textContent = total;
        document.getElementById('upcomingEvents').textContent = upcoming;
        document.getElementById('todayEvents').textContent = todayEvents;
        document.getElementById('pastEvents').textContent = past;
        
        // Render upcoming events list
        const dashboardList = document.getElementById('dashboardEventsList');
        const upcomingEvents = events.filter(e => !DateUtils.isPast(e.date)).slice(0, 5);
        
        if (upcomingEvents.length === 0) {
            dashboardList.innerHTML = '<p style="color: var(--color-text-secondary);">No upcoming events</p>';
            return;
        }
        
        dashboardList.innerHTML = upcomingEvents.map(event => {
            const status = DateUtils.getEventStatus(event.date);
            const badgeColors = {
                today: 'background: #fef3c7; color: #92400e;',
                upcoming: 'background: #dbeafe; color: #1e40af;',
                future: 'background: #f3f4f6; color: #374151;'
            };
            
            return `
                <div class="dashboard-event-item">
                    <div class="dashboard-event-info">
                        <h4>${UIRenderer.escapeHtml(event.title)}</h4>
                        <p>${DateUtils.formatDateRelative(event.date)}</p>
                    </div>
                    <span class="dashboard-event-badge" style="${badgeColors[status]}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
            `;
        }).join('');
    }
};

// ===========================
// Calendar Manager
// ===========================

const CalendarManager = {
    currentDate: new Date(),

    init() {
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        this.render();
    },

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
        
        // Get calendar data
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Get events
        const events = StateManager.getSortedEvents();
        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.date]) {
                eventsByDate[event.date] = [];
            }
            eventsByDate[event.date].push(event);
        });
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = daysInPrevMonth - i;
            grid.appendChild(day);
        }
        
        // Current month days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = i;
            
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            // Check if today
            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                day.classList.add('today');
            }
            
            // Check if has event
            if (eventsByDate[dateString]) {
                day.classList.add('has-event');
                day.title = eventsByDate[dateString].map(e => e.title).join(', ');
            }
            
            grid.appendChild(day);
        }
        
        // Next month days
        const remainingDays = 42 - (firstDay + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = i;
            grid.appendChild(day);
        }
    }
};

// ===========================
// Category Manager
// ===========================

const CategoryManager = {
    STORAGE_KEY: 'eventReminder_categories',
    categories: [],

    init() {
        this.loadCategories();
        
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.addCategory());
        document.getElementById('newCategory')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
    },

    loadCategories() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.categories = stored ? JSON.parse(stored) : [
            { id: 'work', name: 'Work', color: '#667eea' },
            { id: 'personal', name: 'Personal', color: '#f093fb' },
            { id: 'family', name: 'Family', color: '#4facfe' }
        ];
    },

    saveCategories() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.categories));
    },

    addCategory() {
        const input = document.getElementById('newCategory');
        const colorInput = document.getElementById('categoryColor');
        const name = input.value.trim();
        
        if (!name) return;
        
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: name,
            color: colorInput.value
        };
        
        this.categories.push(newCategory);
        this.saveCategories();
        this.render();
        
        input.value = '';
    },

    deleteCategory(id) {
        this.categories = this.categories.filter(cat => cat.id !== id);
        this.saveCategories();
        this.render();
    },

    render() {
        const list = document.getElementById('categoriesList');
        if (!list) return;
        
        list.innerHTML = this.categories.map(cat => `
            <div class="category-item" style="border-left-color: ${cat.color}">
                <div class="category-info">
                    <span class="category-color-dot" style="background: ${cat.color}"></span>
                    <span class="category-name">${cat.name}</span>
                </div>
                <button class="btn btn-delete" onclick="CategoryManager.deleteCategory('${cat.id}')" style="padding: 4px 8px; font-size: 12px;">
                    Delete
                </button>
            </div>
        `).join('');
        
        // Render filters
        const filters = document.getElementById('categoryFilters');
        if (filters) {
            filters.innerHTML = `
                <button class="category-filter-btn active" onclick="CategoryManager.filterByCategory(null)">All</button>
                ${this.categories.map(cat => `
                    <button class="category-filter-btn" onclick="CategoryManager.filterByCategory('${cat.id}')">
                        ${cat.name}
                    </button>
                `).join('')}
            `;
        }
    },

    filterByCategory(categoryId) {
        // Update active button
        document.querySelectorAll('.category-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // For now, just log - you can implement filtering in events tab
        console.log('Filter by category:', categoryId);
    }
};

// ===========================
// Settings Manager
// ===========================

const SettingsManager = {
    init() {
        // Email notifications toggle
        document.getElementById('emailNotifications')?.addEventListener('change', (e) => {
            localStorage.setItem('emailNotifications', e.target.checked);
        });
        
        // Notification email
        document.getElementById('notificationEmail')?.addEventListener('change', (e) => {
            EmailService.RECIPIENT_EMAIL = e.target.value;
            localStorage.setItem('notificationEmail', e.target.value);
        });
        
        // Browser notifications
        document.getElementById('browserNotifications')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.requestNotificationPermission();
            }
        });
        
        // Compact view
        document.getElementById('compactView')?.addEventListener('change', (e) => {
            document.body.classList.toggle('compact-view', e.target.checked);
            localStorage.setItem('compactView', e.target.checked);
        });
        
        // Export data
        document.getElementById('exportData')?.addEventListener('click', () => this.exportData());
        
        // Import data
        document.getElementById('importData')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        // Clear all data
        document.getElementById('clearAllData')?.addEventListener('click', () => this.clearAllData());
        
        // Load saved settings
        this.loadSettings();
    },

    loadSettings() {
        const emailEnabled = localStorage.getItem('emailNotifications') !== 'false';
        const compactView = localStorage.getItem('compactView') === 'true';
        const savedEmail = localStorage.getItem('notificationEmail');
        
        if (document.getElementById('emailNotifications')) {
            document.getElementById('emailNotifications').checked = emailEnabled;
        }
        
        if (document.getElementById('compactView')) {
            document.getElementById('compactView').checked = compactView;
            document.body.classList.toggle('compact-view', compactView);
        }
        
        if (savedEmail && document.getElementById('notificationEmail')) {
            document.getElementById('notificationEmail').value = savedEmail;
            EmailService.RECIPIENT_EMAIL = savedEmail;
        }
    },

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('Event Reminder', {
                    body: 'Notifications enabled! You will receive alerts for your events.',
                    icon: '📅'
                });
            }
        }
    },

    exportData() {
        const data = {
            events: StateManager.events,
            categories: CategoryManager.categories,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event-reminder-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        NotificationManager.success('Export Successful', 'Your data has been exported');
    },

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.events) {
                    StateManager.events = data.events;
                    StateManager.saveToStorage();
                }
                
                if (data.categories) {
                    CategoryManager.categories = data.categories;
                    CategoryManager.saveCategories();
                }
                
                // Refresh UI
                UIRenderer.renderEvents();
                DashboardManager.update();
                CategoryManager.render();
                
                NotificationManager.success('Import Successful', `Imported ${data.events.length} events`);
            } catch (error) {
                NotificationManager.error('Import Failed', 'Invalid file format');
            }
        };
        reader.readAsText(file);
    },

    clearAllData() {
        if (confirm('Are you sure you want to delete ALL events and data? This cannot be undone!')) {
            localStorage.clear();
            StateManager.events = [];
            CategoryManager.categories = [];
            UIRenderer.renderEvents();
            DashboardManager.update();
            CategoryManager.render();
            NotificationManager.success('Data Cleared', 'All data has been deleted');
        }
    }
};

// Update initApp to initialize new managers
function initApp() {
    // Initialize theme
    ThemeManager.init();

    // Initialize email service
    EmailService.init();

    // Initialize state
    StateManager.init();

    // Initialize UI
    UIRenderer.init();

    // Initialize new managers
    TabManager.init();
    DashboardManager.update();
    CalendarManager.init();
    CategoryManager.init();
    CategoryManager.render();
    SettingsManager.init();

    // Render initial events
    UIRenderer.renderEvents();

    // Start countdown timer
    CountdownManager.start();

    // Check for event reminders on load
    EmailService.checkAndSendReminders();

    // Set up periodic reminder checks (check every hour)
    setInterval(() => {
        EmailService.checkAndSendReminders();
    }, 60 * 60 * 1000);

    // Attach event listeners
    UIRenderer.elements.eventForm.addEventListener('submit', EventHandlers.handleSubmit);
    UIRenderer.elements.eventDescription.addEventListener('input', EventHandlers.handleDescriptionInput);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => ThemeManager.toggle());
    }

    // Initialize character count
    UIRenderer.updateCharCount();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            CountdownManager.stop();
        } else {
            CountdownManager.start();
        }
    });

    // Log initialization
    console.log('Event Reminder Tool v2.0 initialized successfully');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}