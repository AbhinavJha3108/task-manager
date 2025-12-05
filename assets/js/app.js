// Task Manager JavaScript Application
// Handles all task management functionality

class TaskManager {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this.init();
    }

    // Initialize the application
    init() {
        this.loadTasksFromStorage();
        this.renderTasks();
        this.updateCounts();
        this.setupEventListeners();
    }

    // Load tasks from localStorage
    loadTasksFromStorage() {
        const stored = localStorage.getItem('taskManagerTasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
            this.nextId = Math.max(...this.tasks.map(t => t.id), 0) + 1;
        }
    }

    // Save tasks to localStorage
    saveTasksToStorage() {
        localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks));
    }

    // Setup event listeners
    setupEventListeners() {
        // Close modal when clicking outside
        window.onclick = (event) => {
            const modal = document.getElementById('taskModal');
            if (event.target === modal) {
                this.closeModal();
            }
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openModal();
            }
        });
    }

    // Open modal
    openModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const modalTitle = document.querySelector('.modal-title');
        
        if (taskId) {
            // Edit mode
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                modalTitle.textContent = 'Edit Task';
                document.getElementById('taskName').value = task.taskName;
                document.getElementById('assigneeName').value = task.assigneeName;
                document.getElementById('teamName').value = task.teamName;
                document.getElementById('status').value = task.status;
                form.dataset.editId = taskId;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Task';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
        document.getElementById('taskName').focus();
    }

    // Close modal
    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.getElementById('taskForm').reset();
        delete document.getElementById('taskForm').dataset.editId;
    }

    // Handle form submission
    handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const form = event.target;
        const editId = form.dataset.editId;
        const taskName = formData.get('taskName').trim();
        
        if (editId) {
            // Edit existing task
            const taskIndex = this.tasks.findIndex(t => t.id === parseInt(editId));
            if (taskIndex !== -1) {
                // Check for duplicate task name (excluding current task)
                if (this.tasks.some(task => task.id !== parseInt(editId) && task.taskName.toLowerCase() === taskName.toLowerCase())) {
                    this.showErrorMessage('Task name already exists!');
                    return;
                }
                
                this.tasks[taskIndex] = {
                    ...this.tasks[taskIndex],
                    taskName: taskName,
                    assigneeName: formData.get('assigneeName').trim(),
                    teamName: formData.get('teamName').trim(),
                    status: formData.get('status')
                };
                
                this.saveTasksToStorage();
                this.renderTasks();
                this.updateCounts();
                this.closeModal();
                this.showSuccessMessage('Task updated successfully!');
            }
        } else {
            // Add new task
            // Check for duplicate task name
            if (this.tasks.some(task => task.taskName.toLowerCase() === taskName.toLowerCase())) {
                this.showErrorMessage('Task name already exists!');
                return;
            }
            
            const task = {
                id: this.nextId++,
                taskName: taskName,
                assigneeName: formData.get('assigneeName').trim(),
                teamName: formData.get('teamName').trim(),
                status: formData.get('status'),
                createdAt: new Date().toISOString()
            };
            
            this.tasks.push(task);
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateCounts();
            this.closeModal();
            this.showSuccessMessage('Task added successfully!');
        }
    }

    // Edit task
    editTask(taskId) {
        this.openModal(taskId);
    }

    // Delete task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasksToStorage();
            this.renderTasks();
            this.updateCounts();
            this.showSuccessMessage('Task deleted successfully!');
        }
    }

    // Render tasks
    renderTasks() {
        const todoContainer = document.getElementById('todoTasks');
        const doingContainer = document.getElementById('doingTasks');
        const doneContainer = document.getElementById('doneTasks');

        // Clear containers
        todoContainer.innerHTML = '';
        doingContainer.innerHTML = '';
        doneContainer.innerHTML = '';

        // Group tasks by status
        const todoTasks = this.tasks.filter(t => t.status === 'todo');
        const doingTasks = this.tasks.filter(t => t.status === 'doing');
        const doneTasks = this.tasks.filter(t => t.status === 'done');

        // Render tasks in appropriate columns
        this.renderTaskList(todoTasks, todoContainer);
        this.renderTaskList(doingTasks, doingContainer);
        this.renderTaskList(doneTasks, doneContainer);

        // Show empty states if needed
        if (todoTasks.length === 0) {
            todoContainer.innerHTML = '<div class="empty-state">No tasks yet. Click "Add Task" to create one!</div>';
        }
        if (doingTasks.length === 0) {
            doingContainer.innerHTML = '<div class="empty-state">No tasks in progress</div>';
        }
        if (doneTasks.length === 0) {
            doneContainer.innerHTML = '<div class="empty-state">No completed tasks</div>';
        }
    }

    // Render task list
    renderTaskList(taskList, container) {
        taskList.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    // Create task element
    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';
        taskDiv.innerHTML = `
            <div class="task-title">${this.escapeHtml(task.taskName)}</div>
            <div class="task-meta">
                <div class="task-assignee">
                    👤 ${this.escapeHtml(task.assigneeName)}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="task-team">${this.escapeHtml(task.teamName)}</div>
                    <button class="edit-btn" onclick="taskManager.editTask(${task.id})">Edit</button>
                    <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `;
        return taskDiv;
    }

    // Update column counts
    updateCounts() {
        const todoCount = this.tasks.filter(t => t.status === 'todo').length;
        const doingCount = this.tasks.filter(t => t.status === 'doing').length;
        const doneCount = this.tasks.filter(t => t.status === 'done').length;

        document.getElementById('todoCount').textContent = todoCount;
        document.getElementById('doingCount').textContent = doingCount;
        document.getElementById('doneCount').textContent = doneCount;
    }

    // Show success message
    showSuccessMessage(message) {
        this.showMessage(message, '#48bb78');
    }

    // Show error message
    showErrorMessage(message) {
        this.showMessage(message, '#f56565');
    }

    // Show message (generic)
    showMessage(message, color) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Global functions for HTML event handlers
let taskManager;

function openModal() {
    taskManager.openModal();
}

function closeModal() {
    taskManager.closeModal();
}

function handleSubmit(event) {
    taskManager.handleSubmit(event);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});