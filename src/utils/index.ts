import axios from 'axios';

const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
const perPage = 100;
const username = import.meta.env.VITE_REACT_APP_API_USERNAME;
const password = import.meta.env.VITE_REACT_APP_API_PASSWORD;

export const stripHtmlTags = (str: any) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    let text = div.textContent || div.innerText || '';
    text = text.replace(/\s+/g, ' ').trim();
    text = `"${text}"`;
    return text;
};

export const getAllProducts = async () => {
    try {
        let allProducts: any = [];
        let page = 1;

        while (true) {
            const response = await axios.get(`${baseUrl}/products`, {
                auth: {
                    username,
                    password,
                },
                params: {
                    per_page: perPage,
                    page,
                    status: 'publish',
                },
            });

            const products = response.data;

            if (products.length === 0) {
                break;
            }

            allProducts = allProducts.concat(products);
            page++;
        }

        return allProducts;
    } catch (error) {
        console.error('Error retrieving products:', error);
        return null;
    }
};

export const fetchProductsByDateRange = async ({
    startDate,
    endDate,
}: {
    startDate: string | null;
    endDate: string | null;
}) => {
    try {
        const response = await axios.get(baseUrl, {
            auth: {
                username,
                password,
            },
            params: {
                status: 'publish',
                after: startDate,
                before: endDate,
            },
        });

        const products = response.data;
        console.log('Products created between the specified date range:', products);
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};

export const fetchProductsByCategory = async ({ catId }: { catId: string | number | null }) => {
    try {
        const res = axios.get(`${baseUrl}/products?category=${catId}`, {
            auth: {
                username,
                password,
            },
        });
        return res;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};

export const fetchProductCategories = async () => {
    try {
        const res = axios.get(`${baseUrl}/products/categories`, {
            auth: {
                username,
                password,
            },
        });
        return res;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
};