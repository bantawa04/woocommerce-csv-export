import { useEffect, useState } from 'react';
import './app.css';
import { Radio, RadioChangeEvent, Select, DatePicker, Button } from 'antd';
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import LoadingBar from 'react-top-loading-bar';
import {
    getAllProducts,
    stripHtmlTags,
    fetchProductsByDateRange,
    fetchProductsByCategory,
    fetchProductCategories,
} from './utils';
interface ICategory {
    value: string;
    label: string;
}

function App() {
    const [progress, setProgress] = useState({
        state: 200,
        count: 10,
    });
    const [exportType, setExportType] = useState<number | null>(null);
    const [categories, setCategories] = useState<ICategory[]>([
        {
            value: '1',
            label: 'Not Identified',
        },
        {
            value: '2',
            label: 'Closed',
        },
        {
            value: '3',
            label: 'Communicated',
        },
        {
            value: '4',
            label: 'Identified',
        },
        {
            value: '5',
            label: 'Resolved',
        },
        {
            value: '6',
            label: 'Cancelled',
        },
    ]);
    const [categoryId, setCategoryId] = useState<string | number | null>(null);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    const onChange = (e: RadioChangeEvent) => {
        setExportType(e.target.value);
    };

    const downloadCSV = async () => {
        try {
            let products;
            setProgress((prevState) => ({
                ...prevState,
                state: 200,
                count: 0,
            }));
            if (exportType === 1) {
                products = await getAllProducts();
            } else if (exportType === 2) {
                products = await fetchProductsByDateRange({ startDate, endDate });
            } else {
                products = await fetchProductsByCategory({ catId: categoryId });
                return;
            }

            if (products) {
                const csvRows = [
                    [
                        'id',
                        'title',
                        'description',
                        'availability',
                        'condition',
                        'price',
                        'link',
                        'image_link',
                        'additional_image_link',
                        'brand',
                        'sale_price',
                        'google_product_category',
                    ], // CSV header
                    ...products.map((product: any) => {
                        const brand =
                            product.meta_data.find((meta: any) => meta.key === 'brand')?.value ||
                            '';
                        const images = product.images.map((image: any) => {
                            const src = image.src.replace(/\?.*$/, '');
                            return src;
                        });
                        const newImages = [...images];
                        newImages.shift();
                        const additionalImageLinks = newImages.join(', ');
                        return [
                            product.id,
                            `"${product.name}"`,
                            stripHtmlTags(product.description),
                            'in stock',
                            'new',
                            product.regular_price ? product.regular_price : product.price,
                            product.permalink,
                            images[0],
                            `"${additionalImageLinks}"`,
                            brand,
                            product.sale_price,
                            'Health & Beauty > Beauty > Skin CareHealth & Beauty > Beauty > Skin Care',
                        ];
                    }),
                ];

                const csvContent = csvRows.map((row) => row.join(',')).join('\n');

                const blob = new Blob([csvContent], {
                    type: 'text/csv;charset=utf-8;',
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'products.csv'); // Change the file name as per your requirement
                link.style.visibility = 'hidden';
                document.body.appendChild(link);

                const updateProgress = (event: any) => {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress((prevState) => ({
                        ...prevState,
                        count: percent, // Update the count based on progress percentage
                    }));
                };
                link.addEventListener('progress', updateProgress);

                link.click();

                document.body.removeChild(link);
                link.removeEventListener('progress', updateProgress);

                console.log('CSV file downloaded successfully');
                setProgress((prevState) => ({
                    ...prevState,
                    count: 100, // Set the count to 100 to indicate completion
                }));
            }
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetchProductCategories();
                const data = res?.data;

                const extractedData = data.map(
                    ({ id, name }: { id: number | string; name: string }) => ({ id, name })
                );
                setCategories(extractedData);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <LoadingBar
                color={progress.state === 200 ? '#28b485' : '#f11946'}
                progress={progress.count}
                onLoaderFinished={() =>
                    setProgress((prevState) => ({
                        ...prevState,
                        state: 200,
                        count: 0,
                    }))
                }
            />
            <div className={'App'}>
                <div className="headerTitle">
                    <h1>Woo Commerce Exporter</h1>
                </div>
                <div className="radioOptionsWrapper">
                    <Radio.Group onChange={onChange} value={exportType}>
                        <Radio value={1}>
                            <span className={'Label'}>All Products</span>
                        </Radio>
                        <Radio value={2}>
                            <span className={'Label'}>Product by date</span>
                        </Radio>
                        <Radio value={3}>
                            <span className={'Label'}>Product by category</span>
                        </Radio>
                    </Radio.Group>
                </div>
                <div className="optionsWrapper">
                    <RangePicker
                        size={'large'}
                        className={exportType === 2 ? '' : 'hidden'}
                        onChange={(_, date) => {
                            if (date.length > 0) {
                                const fromDate = dayjs(date[0]).startOf('day').toISOString();
                                const toDate = dayjs(date[1])
                                    .set('hour', dayjs().hour())
                                    .set('minute', dayjs().minute())
                                    .set('second', dayjs().second())
                                    .toISOString();
                                const formattedDate = { fromDate, toDate };
                                setStartDate(formattedDate.fromDate);
                                setEndDate(formattedDate.toDate);
                            }
                            return;
                        }}
                    />
                    <Select
                        className={exportType === 3 ? '' : 'hidden'}
                        showSearch
                        style={{ width: 200 }}
                        placeholder="Search to Select"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').includes(input)}
                        filterSort={(optionA, optionB) =>
                            (optionA?.label ?? '')
                                .toLowerCase()
                                .localeCompare((optionB?.label ?? '').toLowerCase())
                        }
                        onChange={(v) => setCategoryId(v)}
                        options={categories}
                    />
                </div>
                <div className="buttonWrapper">
                    <Button type="primary" onClick={() => downloadCSV()}>
                        <DownloadOutlined />
                        Download
                    </Button>
                </div>
            </div>
        </>
    );
}

export default App;
