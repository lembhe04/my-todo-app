import { supabase } from './supabase.js';

// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const taskTemplate = document.getElementById('task-template');

// State
let currentFilter = 'all';
let currentSort = 'created_at-desc';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await renderTasks();
    setupEventListeners();
    setupRealtimeUpdates();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize app. Please refresh.');
  }
});

// Task operations
async function fetchTasks() {
  const [column, order] = currentSort.split('-');
  
  let query = supabase
    .from('tasks')
    .select('*')
    .order(column, { ascending: order === 'asc' });
  
  if (currentFilter === 'completed') {
    query = query.eq('is_completed', true);
  } else if (currentFilter === 'pending') {
    query = query.eq('is_completed', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching tasks:', error);
    showError('Failed to load tasks');
    return [];
  }
  
  return data;
}

async function addTask(task) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: user.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date || null,
      is_completed: false
    }])
    .select();
  
  if (error) {
    console.error('Error adding task:', error);
    showError(error.message);
    return null;
  }
  
  return data[0];
}

async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating task:', error);
    showError(error.message);
    return null;
  }
  
  return data[0];
}

async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    showError(error.message);
    return false;
  }
  
  return true;
}

// UI Functions
async function renderTasks() {
  try {
    tasksContainer.innerHTML = '';
    const tasks = await fetchTasks();
    
    if (!tasks?.length) {
      tasksContainer.innerHTML = '<p class="empty-state">No tasks found. Add your first task!</p>';
      return;
    }

    tasks.forEach(task => {
      const taskElement = createTaskElement(task);
      if (taskElement) tasksContainer.appendChild(taskElement);
    });
  } catch (error) {
    console.error('Render error:', error);
    tasksContainer.innerHTML = '<p class="error-state">Failed to load tasks. Please try again.</p>';
  }
}

function createTaskElement(task) {
  try {
    if (!task?.id) throw new Error('Invalid task data');
    
    const clone = taskTemplate.content.cloneNode(true);
    const taskElement = clone.querySelector('.task-card');
    if (!taskElement) throw new Error('Task template corrupted');

    // Set basic data
    taskElement.dataset.taskId = task.id;
    taskElement.classList.toggle('completed', task.is_completed);

    // Set checkbox
    const checkbox = taskElement.querySelector('.task-status');
    if (checkbox) checkbox.checked = task.is_completed;

    // Set text content
    const setText = (selector, text) => {
      const el = taskElement.querySelector(selector);
      if (el) el.textContent = text || '';
    };

    setText('.task-title', task.title);
    setText('.task-description', task.description);
    setText('.task-due-date', task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No due date');
    setText('.task-created-at', `Added: ${formatDate(task.created_at)}`);

    // Add event listeners
    const addListener = (selector, event, handler) => {
      const el = taskElement.querySelector(selector);
      if (el) el.addEventListener(event, handler);
    };

    addListener('.task-status', 'change', () => handleTaskStatusChange(task.id, !task.is_completed));
    addListener('.task-edit', 'click', () => handleEditTask(task));
    addListener('.task-delete', 'click', () => handleDeleteTask(task.id));

    return taskElement;
  } catch (error) {
    console.error('Create task element error:', error);
    return null;
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown date';
  }
}

// Event Handlers
async function handleTaskSubmit(e) {
  e.preventDefault();
  
  try {
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
      showError('Task title is required');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const newTask = await addTask({
      user_id: user.id,
      title: title,
      description: document.getElementById('task-description').value.trim(),
      due_date: document.getElementById('task-due-date').value || null
    });
    
    if (newTask) {
      taskForm.reset();
      await renderTasks();
    }
  } catch (error) {
    console.error('Submit error:', error);
    showError('Failed to add task');
  }
}

async function handleTaskStatusChange(taskId, isCompleted) {
  try {
    await updateTask(taskId, { is_completed: isCompleted });
    await renderTasks();
  } catch (error) {
    console.error('Status change error:', error);
    await renderTasks(); // Revert UI state
  }
}

function handleEditTask(task) {
  try {
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      document.getElementById('task-due-date').value = dueDate.toISOString().slice(0, 16);
    } else {
      document.getElementById('task-due-date').value = '';
    }

    const submitButton = taskForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Update Task';
    
    // Temporarily replace submit handler
    const originalHandler = taskForm.onsubmit;
    taskForm.onsubmit = async (e) => {
      e.preventDefault();
      await handleTaskUpdate(task.id);
      taskForm.onsubmit = originalHandler;
      submitButton.textContent = 'Add Task';
    };
  } catch (error) {
    console.error('Edit error:', error);
    showError('Failed to start editing');
  }
}

async function handleTaskUpdate(taskId) {
  try {
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
      showError('Task title is required');
      return;
    }

    const updated = await updateTask(taskId, {
      title: title,
      description: document.getElementById('task-description').value.trim(),
      due_date: document.getElementById('task-due-date').value || null
    });
    
    if (updated) {
      taskForm.reset();
      await renderTasks();
    }
  } catch (error) {
    console.error('Update error:', error);
    showError('Failed to update task');
  }
}

async function handleDeleteTask(taskId) {
  try {
    const confirmed = confirm('Are you sure you want to delete this task?');
    if (confirmed) {
      const success = await deleteTask(taskId);
      if (success) await renderTasks();
    }
  } catch (error) {
    console.error('Delete error:', error);
    showError('Failed to delete task');
  }
}

async function handleFilterChange(filter) {
  currentFilter = filter;
  await renderTasks();
}

async function handleSortChange(sort) {
  currentSort = sort;
  await renderTasks();
}

// Realtime Updates
function setupRealtimeUpdates() {
  try {
    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${supabase.auth.user()?.id}`
        },
        () => renderTasks()
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  } catch (error) {
    console.error('Realtime setup error:', error);
    return () => {};
  }
}

// Setup Event Listeners
function setupEventListeners() {
  if (taskForm) {
    taskForm.addEventListener('submit', handleTaskSubmit);
  }
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      handleFilterChange(filter);
    });
  });
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      handleSortChange(e.target.value);
    });
  }
}

// Helper Functions
function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'message error';
  errorEl.textContent = message;
  document.body.appendChild(errorEl);
  
  setTimeout(() => errorEl.remove(), 3000);
}