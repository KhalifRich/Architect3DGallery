using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGallery.Models;
using Architect3DGalleryWeb.DataAccess.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Architect3DGallery.DataAccess.Repository
{
    public class ProductRepository : Repository<Product>, IProductRepository
    {
        private readonly ApplicationDbContext _db;

        public ProductRepository(ApplicationDbContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Product product)
        {
            var objFromDb = _db.Products.FirstOrDefault(s => s.Id == product.Id);
            if (objFromDb != null)
            {
                if (product.ImageUrl != null)
                {
                    objFromDb.ImageUrl = product.ImageUrl;
                }
                objFromDb.Name = product.Name;
                objFromDb.Size = product.Size;
                objFromDb.Description = product.Description;
                objFromDb.Price = product.Price;
                objFromDb.ProductTypeId = product.ProductTypeId;
                
            }
        }
    }
}