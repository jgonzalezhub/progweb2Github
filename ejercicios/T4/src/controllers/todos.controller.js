import { todos } from '../data/todos.js';
import { ApiError } from '../middleware/errorHandler.js';

export const getAll = (req, res) => {
  let resultado = [...todos];

  const { completed, priority } = req.query;

  if (completed !== undefined) {
    resultado = resultado.filter(
      t => t.completed === (completed === 'true')
    );
  }

  if (priority) {
    resultado = resultado.filter(t => t.priority === priority);
  }

  res.json(resultado);
};

export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    throw ApiError.notFound(`Todo con ID ${id} no encontrado`);
  }

  res.json(todo);
};

export const create = (req, res) => {
  const { title, description, priority } = req.body;

  const nuevoTodo = {
    id: todos.length + 1,
    title,
    description: description || null,
    completed: false,
    priority: priority || 'medium',
    createdAt: new Date().toISOString()
  };

  todos.push(nuevoTodo);

  res.status(201).json(nuevoTodo);
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    throw ApiError.notFound();
  }

  todos[index] = {
    ...todos[index],
    ...req.body
  };

  res.json(todos[index]);
};

export const remove = (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    throw ApiError.notFound();
  }

  todos.splice(index, 1);

  res.status(204).end();
};

export const toggle = (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    throw ApiError.notFound();
  }

  todo.completed = !todo.completed;

  res.json(todo);
};
