document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const tasksContainer = document.getElementById('tasksContainer');
    const taskDetailModal = document.getElementById('taskDetailModal');
    const projectModal = document.getElementById('projectModal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    const addProjectBtn = document.getElementById('addProjectBtn');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const projectsList = document.getElementById('projectsList');
    const menuItems = document.querySelectorAll('.menu-item');
    const viewTitle = document.getElementById('viewTitle');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let projects = JSON.parse(localStorage.getItem('projects')) || [
        { id: 'inbox', name: 'Inbox', color: '#6c5ce7' },
        { id: 'work', name: 'Work', color: '#00b894' },
        { id: 'personal', name: 'Personal', color: '#fd79a8' }
    ];
    let currentView = 'inbox';
    let currentProjectFilter = null;
    let currentTaskId = null;
    let selectedColor = '#6c5ce7';

    // Initialize the app
    function init() {
        renderProjects();
        renderTasks();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Task input
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Quick action buttons
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                // In a real app, these would open appropriate UI elements
                alert(`${action} action would open here`);
            });
        });
        
        // Menu items
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                if (view) {
                    currentView = view;
                    currentProjectFilter = null;
                    updateView();
                }
            });
        });
        
        // Modal close buttons
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                taskDetailModal.style.display = 'none';
                projectModal.style.display = 'none';
            });
        });
        
        // Save task button
        saveTaskBtn.addEventListener('click', saveTask);
        
        // Delete task button
        deleteTaskBtn.addEventListener('click', deleteTask);
        
        // Project buttons
        addProjectBtn.addEventListener('click', function() {
            document.getElementById('projectName').value = '';
            projectModal.style.display = 'flex';
        });
        
        saveProjectBtn.addEventListener('click', addProject);
        
        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                selectedColor = this.getAttribute('data-color');
            });
        });
        
        // Click outside modal to close
        window.addEventListener('click', function(e) {
            if (e.target === taskDetailModal) {
                taskDetailModal.style.display = 'none';
            }
            if (e.target === projectModal) {
                projectModal.style.display = 'none';
            }
        });
    }

    // Add a new task
    function addTask() {
        const title = taskInput.value.trim();
        if (title) {
            const newTask = {
                id: Date.now().toString(),
                title: title,
                description: '',
                dueDate: null,
                priority: 'medium',
                project: 'inbox',
                completed: false,
                createdAt: new Date().toISOString(),
                subtasks: []
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
            
            // Open task detail modal for editing
            openTaskDetailModal(newTask.id);
        }
    }

    // Save task changes
    function saveTask() {
        const taskIndex = tasks.findIndex(task => task.id === currentTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title: document.getElementById('modalTaskTitle').textContent,
                description: document.getElementById('taskDescription').value,
                dueDate: document.getElementById('taskDueDate').value,
                priority: document.getElementById('taskPriority').value,
                project: document.getElementById('taskProject').value,
                subtasks: Array.from(document.querySelectorAll('.subtask-item')).map(item => ({
                    id: item.getAttribute('data-id'),
                    title: item.querySelector('.subtask-content').textContent,
                    completed: item.querySelector('.subtask-checkbox').checked
                }))
            };
            
            saveTasks();
            renderTasks();
            taskDetailModal.style.display = 'none';
        }
    }

    // Delete task
    function deleteTask() {
        tasks = tasks.filter(task => task.id !== currentTaskId);
        saveTasks();
        renderTasks();
        taskDetailModal.style.display = 'none';
    }

    // Add a new project
    function addProject() {
        const name = document.getElementById('projectName').value.trim();
        if (name) {
            const newProject = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name,
                color: selectedColor
            };
            
            projects.push(newProject);
            saveProjects();
            renderProjects();
            projectModal.style.display = 'none';
        }
    }

    // Open task detail modal
    function openTaskDetailModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            currentTaskId = taskId;
            
            // Set modal values
            document.getElementById('modalTaskTitle').textContent = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskPriority').value = task.priority;
            
            // Set project dropdown
            const projectSelect = document.getElementById('taskProject');
            projectSelect.innerHTML = '';
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                if (project.id === task.project) {
                    option.selected = true;
                }
                projectSelect.appendChild(option);
            });
            
            // Set subtasks
            const subtasksContainer = document.getElementById('subtasksContainer');
            subtasksContainer.innerHTML = '';
            task.subtasks.forEach(subtask => {
                const subtaskItem = document.createElement('div');
                subtaskItem.className = 'subtask-item';
                subtaskItem.setAttribute('data-id', subtask.id);
                subtaskItem.innerHTML = `
                    <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                    <div class="subtask-content">${subtask.title}</div>
                    <div class="subtask-actions">
                        <button class="task-action-btn"><i class="fas fa-edit"></i></button>
                        <button class="task-action-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                subtasksContainer.appendChild(subtaskItem);
            });
            
            // Show modal
            taskDetailModal.style.display = 'flex';
        }
    }

    // Render tasks based on current view
    function renderTasks() {
        tasksContainer.innerHTML = '';
        
        let filteredTasks = [...tasks];
        
        // Apply view filter
        switch(currentView) {
            case 'today':
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    return dueDate.toDateString() === today.toDateString();
                });
                break;
            case 'upcoming':
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    return dueDate > today;
                });
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            default:
                // Inbox or project view
                if (currentProjectFilter) {
                    filteredTasks = filteredTasks.filter(task => task.project === currentProjectFilter);
                }
        }
        
        // Sort tasks by due date (soonest first)
        filteredTasks.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Render each task
        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = '<div class="empty-state">No tasks found</div>';
        } else {
            filteredTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item';
                taskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="task-details">
                            ${task.dueDate ? `
                                <div class="task-detail">
                                    <i class="far fa-calendar"></i>
                                    <span>${formatDate(task.dueDate)}</span>
                                </div>
                            ` : ''}
                            <div class="task-detail">
                                <div class="task-priority priority-${task.priority}"></div>
                                <span>${task.priority}</span>
                            </div>
                            ${task.project ? `
                                <div class="task-detail">
                                    <i class="fas fa-tag" style="color: ${getProjectColor(task.project)}"></i>
                                    <span>${getProjectName(task.project)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" data-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn" data-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add event listeners
                const checkbox = taskElement.querySelector('.task-checkbox');
                checkbox.addEventListener('change', function() {
                    const taskId = this.getAttribute('data-id');
                    toggleTaskCompletion(taskId);
                });
                
                const editBtn = taskElement.querySelectorAll('.task-action-btn')[0];
                editBtn.addEventListener('click', function() {
                    const taskId = this.getAttribute('data-id');
                    openTaskDetailModal(taskId);
                });
                
                const deleteBtn = taskElement.querySelectorAll('.task-action-btn')[1];
                deleteBtn.addEventListener('click', function() {
                    const taskId = this.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this task?')) {
                        tasks = tasks.filter(task => task.id !== taskId);
                        saveTasks();
                        renderTasks();
                    }
                });
                
                tasksContainer.appendChild(taskElement);
            });
        }
    }

    // Toggle task completion status
    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    }

    // Render projects list
    function renderProjects() {
        projectsList.innerHTML = '';
        
        projects.forEach(project => {
            if (project.id !== 'inbox') { // Skip inbox as it's in the main menu
                const projectElement = document.createElement('div');
                projectElement.className = 'project-item';
                projectElement.innerHTML = `
                    <div class="project-color" style="background-color: ${project.color}"></div>
                    <span>${project.name}</span>
                `;
                
                projectElement.addEventListener('click', function() {
                    currentView = 'project';
                    currentProjectFilter = project.id;
                    updateView();
                });
                
                projectsList.appendChild(projectElement);
            }
        });
    }

    // Update view based on current filters
    function updateView() {
        // Update active menu item
        menuItems.forEach(item => {
            const view = item.getAttribute('data-view');
            if (view === currentView && !currentProjectFilter) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update view title
        if (currentProjectFilter) {
            viewTitle.textContent = getProjectName(currentProjectFilter);
        } else {
            viewTitle.textContent = currentView.charAt(0).toUpperCase() + currentView.slice(1);
        }
        
        renderTasks();
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Get project name by ID
    function getProjectName(projectId) {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : '';
    }

    // Get project color by ID
    function getProjectColor(projectId) {
        const project = projects.find(p => p.id === projectId);
        return project ? project.color : '#6c5ce7';
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Save projects to localStorage
    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    // Initialize the app
    init();
});