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
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverPositionX, setCoverPositionX] = useState(50);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const titleRef = useRef();
  const authorRef = useRef();
  const isbnRef = useRef();
  const descriptionRef = useRef();
  const quantityRef = useRef();
  const locationRef = useRef();
  const coverRef = useRef();

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

  const cleanupUploadedCover = async (coverUrl) => {
    if (!coverUrl) return;

    const filename = coverUrl.split("/").pop();
    if (!filename) return;

    try {
      await fetch(`${API_URL}/api/upload/${filename}`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch {
      // Best-effort rollback: avoid blocking user flow on cleanup failures.
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setError("");
    setUploadingCover(true);

    let coverUrl = "";

    // Upload cover first if selected
    if (coverRef.current?.files?.[0]) {
      const formData = new FormData();
      formData.append("cover", coverRef.current.files[0]);
      try {
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          credentials: "include",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          coverUrl = uploadData.url;
        } else {
          const errData = await uploadRes.json();
          setError(errData.message || "Error uploading cover");
          setUploadingCover(false);
          return;
        }
      } catch (err) {
        setError("Error uploading cover");
        setUploadingCover(false);
        return;
      }
    }
    setUploadingCover(false);

    const bookData = {
      title: titleRef.current.value,
      author: authorRef.current.value,
      isbn: isbnRef.current.value,
      description: descriptionRef.current.value,
      quantity: parseInt(quantityRef.current.value) || 1,
      location: locationRef.current.value,
      coverImage: coverUrl,
      coverPositionX,
      coverPositionY
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
        coverRef.current.value = "";
        setCoverPreview(null);
        setCoverPositionX(50);
        setCoverPositionY(50);
      } else {
        const data = await response.json();
        await cleanupUploadedCover(coverUrl);
        setError(data.message || "Error creating book");
      }
    } catch (err) {
      await cleanupUploadedCover(coverUrl);
      setError("Error creating book");
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
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
                <div className="mb-4">
                  <label>Book Cover</label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        style={{ width: "100px", height: "130px", objectFit: "cover", objectPosition: `${coverPositionX}% ${coverPositionY}%`, borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                    )}
                    <div>
                      <input type="file" ref={coverRef} accept="image/jpeg,image/png,image/webp" onChange={handleCoverSelect} style={{ fontSize: "0.9rem" }} />
                      {coverPreview && (
                        <div style={{ marginTop: "0.75rem", minWidth: "220px" }}>
                          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Horizontal Focus: {Math.round(coverPositionX)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={coverPositionX}
                            onChange={(e) => setCoverPositionX(Number(e.target.value))}
                          />
                          <label style={{ display: "block", marginTop: "0.5rem", marginBottom: "0.25rem", fontSize: "0.85rem" }}>Vertical Focus: {Math.round(coverPositionY)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={coverPositionY}
                            onChange={(e) => setCoverPositionY(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={uploadingCover}>
                  {uploadingCover ? "Creating..." : "Create Book"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {books.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No books available</p>
      ) : user.role === "ADMIN" ? (
        /* ADMIN: Table view (unchanged) */
        <table>
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>Author</th>
              <th>ISBN</th>
              <th>Location</th>
              <th>Available</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book._id} onClick={() => navigate(`/borrow?bookId=${book._id}`)} style={{ cursor: 'pointer' }}>
                <td>
                  {book.coverImage ? (
                    <img
                      src={`${API_URL}${book.coverImage}`}
                      alt={book.title}
                      className="table-cover-img"
                      style={{ objectPosition: `${book.coverPositionX ?? 50}% ${book.coverPositionY ?? 50}%` }}
                    />
                  ) : (
                    <div className="table-cover-placeholder">No Cover</div>
                  )}
                </td>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.location || "—"}</td>
                <td>{book.available} / {book.quantity}</td>
                <td>
                  <span className={`badge ${book.status === 'DELETED' ? 'deleted' : 'active'}`}>
                    {book.status || "ACTIVE"}
                  </span>
                </td>
                <td>
                  <Link to={`/books/${book._id}`} onClick={(e) => e.stopPropagation()}>
                    <button className="secondary">Manage</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* USER: Card grid view */
        <div className="book-grid">
          {books.map((book) => (
            <div
              key={book._id}
              className="book-card"
              onClick={() => navigate(`/borrow?bookId=${book._id}`)}
            >
              <div className="book-card-cover">
                {book.coverImage ? (
                  <img
                    src={`${API_URL}${book.coverImage}`}
                    alt={book.title}
                    style={{ objectPosition: `${book.coverPositionX ?? 50}% ${book.coverPositionY ?? 50}%` }}
                  />
                ) : (
                  <div className="book-card-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="book-card-info">
                <h3 className="book-card-title">{book.title}</h3>
                <p className="book-card-author">{book.author}</p>
                {book.available > 0 ? (
                  <span className="badge active">Available</span>
                ) : (
                  <span className="badge cancelled">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
