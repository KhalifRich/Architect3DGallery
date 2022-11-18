using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGallery.Models;
using Architect3DGalleryWeb.DataAccess.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Architect3DGallery.DataAccess.Repository
{
    public class ProductTypeRepository : Repository<ProductType>, IProductTypeRepository
    {
        private readonly ApplicationDbContext _db;

        public ProductTypeRepository(ApplicationDbContext db) : base(db)
        {
            _db = db;
        }

        public void Update(ProductType productType)
        {
            var objFromDb = _db.ProductTypes.FirstOrDefault(s => s.Id == productType.Id);
            if (objFromDb != null)
            {
                objFromDb.Name = productType.Name;
               
            }
        }
    }
}