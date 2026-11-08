import '@/styles/shop.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ShopView from '@/app/shop/ShopView';
import { cleanCategoryHandle, getCategories } from '@/lib/medusa';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const clean = cleanCategoryHandle(handle);
  try {
    const categories = await getCategories();
    const cat = categories.find((c) => cleanCategoryHandle(c.handle) === clean);
    return {
      title: cat?.name || clean.charAt(0).toUpperCase() + clean.slice(1),
    };
  } catch (e) {
    return {
      title: clean.charAt(0).toUpperCase() + clean.slice(1),
    };
  }
}

export default async function CategoryPage({ params, searchParams }) {
  const { handle } = await params;
  const clean = cleanCategoryHandle(handle);
  const sp = await searchParams;

  const urlParams = new URLSearchParams();
  Object.entries(sp || {}).forEach(([k, v]) => {
    (Array.isArray(v) ? v : [v]).forEach((val) => urlParams.append(k, String(val)));
  });
  // Ensure the category query parameter is set to this category
  urlParams.set('cat', clean);

  return (
    <div className="shop">
      <SiteHeader />
      <ShopView query={urlParams.toString()} fixedCategory={clean} />
      <SiteFooter />
    </div>
  );
}
