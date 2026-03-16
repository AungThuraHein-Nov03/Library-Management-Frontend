import { useEffect, useState, useRef } from "react";
import { useUser } from "../contexts/UserProvider";
import { Link, useNavigate } from "react-router-dom";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const { user } = useUser();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL;
  
  const titleRef = useRef();
  const authorRef = useRef();
  const isbnRef = useRef();
  const descriptionRef = useRef();
  const quantityRef = useRef();
  const locationRef = useRef();

  const fetchBooks = async (titleOverride, authorOverride) => {
    try {
      const t = titleOverride !== undefined ? titleOverride : searchTitle;
      const a = authorOverride !== undefined ? authorOverride : searchAuthor;
      const params = new URLSearchParams();
      if (t.trim()) params.set("title", t.trim());
      if (a.trim()) params.set("author", a.trim());
      const qs = params.toString();
      const response = await fetch(`${API_URL}/api/books${qs ? `?${qs}` : ""}`, {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else if (response.status === 401) {
        setError("Please login to view books");
      }
    } catch (err) {
      setError("Error fetching books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setError("");
    
    const bookData = {
      title: titleRef.current.value,
      author: authorRef.current.value,
      isbn: isbnRef.current.value,
      description: descriptionRef.current.value,
      quantity: parseInt(quantityRef.current.value) || 1,
      location: locationRef.current.value
    };

    try {
      const response = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bookData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchBooks();
        // Clear form
        titleRef.current.value = "";
        authorRef.current.value = "";
        isbnRef.current.value = "";
        descriptionRef.current.value = "";
        quantityRef.current.value = "1";
        locationRef.current.value = "";
      } else {
        const data = await response.json();
        setError(data.message || "Error creating book");
      }
    } catch (err) {
      setError("Error creating book");
    }
  };

  if (loading) return <div>Loading books...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Library Books</h2>
        <p style={{ color: '#64748b' }}>Welcome, <strong>{user.name}</strong> ({user.role})</p>
      </div>
      
      {error && <div style={{ color: "red", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>{error}</div>}

      {/* Search / Filter */}
      <div className="card mb-4" style={{ maxWidth: "100%", padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Search Books</h3>
        <div className="flex gap-4 items-center">
          <div className="w-full">
            <input type="text" placeholder="By Title" value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} />
          </div>
          <div className="w-full">
            <input type="text" placeholder="By Author" value={searchAuthor} onChange={(e) => setSearchAuthor(e.target.value)} />
          </div>
          <button className="secondary" onClick={() => fetchBooks()}>Search</button>
          <button className="secondary" onClick={() => { setSearchTitle(""); setSearchAuthor(""); fetchBooks("", ""); }}>Clear</button>
        </div>
      </div>
      
      {/* Only ADMIN can see create button */}
      {user.role === "ADMIN" && (
        <div className="mb-4">
          <button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "+ Add New Book"}
          </button>
          
          {showCreateForm && (
            <div className="card mt-4" style={{ maxWidth: "600px", marginLeft: "0" }}>
              <form onSubmit={handleCreateBook}>
                <h3 style={{ marginBottom: "1rem" }}>Create New Book</h3>
                <div className="flex gap-4 mb-4">
                  <div className="w-full">
                    <label>Title</label>
                    <input type="text" ref={titleRef} required />
                  </div>
                  <div className="w-full">
                    <label>Author</label>
                    <input type="text" ref={authorRef} required />
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="w-full">
                    <label>ISBN</label>
                    <input type="text" ref={isbnRef} required />
                  </div>
                  <div className="w-full">
                    <label>Location</label>
                    <input type="text" ref={locationRef} placeholder="e.g., Shelf A-1" />
                  </div>
                  <div className="w-full">
                    <label>Quantity</label>
                    <input type="number" ref={quantityRef} defaultValue="1" min="1" />
                  </div>
                </div>
                <div className="mb-4">
                  <label>Description</label>
                  <textarea ref={descriptionRef} rows="2" />
                </div>
                <button type="submit">Create Book</button>
              </form>
            </div>
          )}
        </div>
      )}
      
      {books.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No books available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Location</th>
              <th>Available</th>
              {user.role === "ADMIN" && <th>Status</th>}
              {user.role === "ADMIN" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book._id} onClick={() => navigate(`/borrow?bookId=${book._id}`)} style={{ cursor: 'pointer' }}>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.location || "—"}</td>
                <td>{book.available} / {book.quantity}</td>
                {user.role === "ADMIN" && (
                  <td>
                    <span className={`badge ${book.status === 'DELETED' ? 'deleted' : 'active'}`}>
                      {book.status || "ACTIVE"}
                    </span>
                  </td>
                )}
                {user.role === "ADMIN" && (
                  <td>
                    <Link to={`/books/${book._id}`} onClick={(e) => e.stopPropagation()}>
                      <button className="secondary">Manage</button>
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}