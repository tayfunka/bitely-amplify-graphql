import "./App.css";
import { useEffect, useState } from "react";

import { generateClient } from "aws-amplify/api";

import { createProduct } from "./graphql/mutations";
import { listProducts } from "./graphql/queries";
import { getProduct } from "./graphql/queries";
import { updateProduct } from "./graphql/mutations";
import { deleteProduct } from "./graphql/mutations";

const initialState = { name: "", price: 0 };
const client = generateClient();

const App = () => {
    const [formState, setFormState] = useState(initialState);
    const [products, setProducts] = useState([]);
    const [product, setProduct] = useState(null);
    const [isUpdateMode, setUpdateMode] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [isUpdateMode]);

    function setInput(key, value) {
        setFormState({ ...formState, [key]: value });
    }
    useEffect(() => {
        if (product && isUpdateMode) {
            setFormState({
                name: product.name,
                price: product.price,
            });
        } else {
            setFormState(initialState);
        }
    }, [product, isUpdateMode]);

    async function fetchProducts() {
        try {
            const productData = await client.graphql({
                query: listProducts,
            });
            const products = productData.data.listProducts.items;
            setProducts(products);
        } catch (err) {
            console.log("error fetching products");
        }
    }

    async function getProductById(id) {
        try {
            const productData = await client.graphql({
                query: getProduct,
                variables: { id },
            });
            const product = productData.data.getProduct;
            setProduct(product);
        } catch (err) {
            console.error("Error getting product:", err);
        }
    }

    async function updateProductById(id) {
        try {
            if (!formState.name || !formState.price) return;
            const updatedProduct = { ...formState, id };
            setProducts(
                products.map((p) => (p.id === id ? updatedProduct : p))
            );
            await client.graphql({
                query: updateProduct,
                variables: {
                    input: updatedProduct,
                },
            });
        } catch (err) {
            console.error("Error updating product:", err);
        }
    }

    async function deleteProductById(id) {
        try {
            const input = { id };
            const productData = await client.graphql({
                query: deleteProduct,
                variables: { input },
            });
            setProducts(products.filter((product) => product.id !== id));
            setProduct(null);
        } catch (err) {
            console.error("Error getting product:", err);
        }
    }

    async function addProduct() {
        try {
            if (!formState.name || !formState.price) return;
            const product = { ...formState };
            setProducts([...products, product]);
            setFormState(initialState);
            await client.graphql({
                query: createProduct,
                variables: {
                    input: product,
                },
            });
        } catch (err) {
            console.log("error creating product:", err);
        }
    }

    return (
        <div style={styles.container}>
            <h2>Bitely Products</h2>
            <input
                onChange={(event) => setInput("name", event.target.value)}
                style={styles.input}
                value={formState.name}
                placeholder="Name"
            />
            <input
                onChange={(event) => setInput("price", event.target.value)}
                style={styles.input}
                value={formState.price}
                placeholder="Price"
            />
            <button style={styles.button} onClick={addProduct}>
                Create Product
            </button>
            {products.map((product, index) => (
                <div
                    key={product.id ? product.id : index}
                    style={styles.product}
                    onClick={() => getProductById(product.id)}
                >
                    <p style={styles.productName}>Name: {product.name}</p>
                    <button
                        style={styles.detailsButton}
                        onClick={() => getProductById(product.id)}
                    >
                        Details
                    </button>
                    <hr></hr>
                </div>
            ))}
            {product && (
                <div style={styles.productDetails}>
                    <h3>Product Details</h3>
                    {isUpdateMode ? (
                        <>
                            <input
                                style={styles.input}
                                value={formState.name}
                                placeholder="Name"
                                onChange={(event) =>
                                    setInput("name", event.target.value)
                                }
                            />
                            <input
                                style={styles.input}
                                value={formState.price}
                                placeholder="Price"
                                onChange={(event) =>
                                    setInput("price", event.target.value)
                                }
                            />
                            <button
                                onClick={() => {
                                    updateProductById(product.id);
                                    setUpdateMode(false);
                                    setFormState(initialState);
                                }}
                            >
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <p>ID: {product.id}</p>
                            <p>Name: {product.name}</p>
                            <p>Price: {product.price}</p>
                            <button
                                onClick={() => deleteProductById(product.id)}
                            >
                                Delete
                            </button>
                            <button onClick={() => setUpdateMode(true)}>
                                Update
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        width: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 20,
    },
    product: { marginBottom: 15 },
    input: {
        border: "none",
        backgroundColor: "#ddd",
        marginBottom: 10,
        padding: 8,
        fontSize: 18,
    },
    productName: { fontSize: 20, fontWeight: "bold" },
    productPrice: { marginBottom: 0 },
    button: {
        backgroundColor: "black",
        color: "white",
        outline: "none",
        fontSize: 18,
        padding: "12px 0px",
    },
    productDetails: {
        marginTop: 20,
        border: "1px solid #ddd",
        padding: 10,
    },
};

export default App;
