import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idProducts = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({ id: In(idProducts) });

    if (idProducts.length !== findProducts.length) {
      throw new AppError('Missing Product');
    }

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsDatabase = await this.findAllById(products);

    const updatedProducts = productsDatabase.map(productInOrder => {
      const productFind = products.find(
        product => product.id === productInOrder.id,
      );

      if (!productFind) {
        throw new AppError('Product not found');
      }

      if (productInOrder.quantity < productFind.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      const newProduct = productInOrder;

      newProduct.quantity -= productFind.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
