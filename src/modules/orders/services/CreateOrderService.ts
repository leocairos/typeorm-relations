import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not exists');
    }

    const productIds = products.map(product => {
      return { id: product.id };
    });

    const productsDatabase = await this.productsRepository.findAllById(
      productIds,
    );

    const productsToOrder = productsDatabase.map(product => {
      const productOrder = products.find(
        productFind => productFind.id === product.id,
      );

      return {
        product_id: product.id,
        price: product.price,
        quantity: productOrder?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsToOrder,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
