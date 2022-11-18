using Architect3DGallery.DataAccess.Repository.IRepository;
using Architect3DGalleryWeb.DataAccess.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Architect3DGallery.DataAccess.Repository
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _db;

        public UnitOfWork(ApplicationDbContext db)
        {
            _db = db;
            //initialize repositories
            ProductType = new ProductTypeRepository(_db);
          
            Product = new ProductRepository(_db);
            OrderDetails = new OrderDetailsRepository(_db);
            ApplicationUser = new ApplicationUserRepository(_db);
            OrderHeader = new OrderHeaderRepository(_db);
            //initialize shopping cart repository
            ShoppingCart = new ShoppingCartRepository(_db);
        }

        public IApplicationUserRepository ApplicationUser { get; private set; }

       
        public IProductRepository Product { get; private set; }
        public IProductTypeRepository ProductType { get; private set; }
        public IShoppingCartRepository ShoppingCart { get; private set; }
        public IOrderDetailsRepository OrderDetails { get; private set; }
        public IOrderHeaderRepository OrderHeader { get; private set; }

        public void Dispose()
        {
            _db.Dispose();
        }

        public void Save()
        {
            _db.SaveChanges();
        }
    }
}