import * as productService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const list = async (req, res, next) => {
  try {
    const data = await productService.listProducts(req.query);
    sendSuccess(res, 200, 'Products fetched successfully', data);
  } catch (e) { next(e); }
};

export const get = async (req, res, next) => {
  try {
    const data = await productService.getProductById(req.params.id);
    sendSuccess(res, 200, 'Product fetched', data);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);
    sendSuccess(res, 201, 'Product created successfully', data);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body);
    sendSuccess(res, 200, 'Product updated successfully', data);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    sendSuccess(res, 200, 'Product deleted successfully');
  } catch (e) { next(e); }
};
