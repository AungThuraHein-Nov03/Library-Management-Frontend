import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPositionX, setCoverPositionX] = useState(50);
  const [coverPositionY, setCoverPositionY] = useState(50);

  const API_URL = import.meta.env.VITE_API_URL;

  const titleRef = useRef();
  const authorRef = useRef();
  const descriptionRef = useRef();
  const quantityRef = useRef();
  const availableRef = useRef();
  const locationRef = useRef();
  const coverRef = useRef();

  const fetchBook = async () => {
    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBook(data);
        setCoverPreview(data.coverImage ? `${API_URL}${data.coverImage}` : null);
        setCoverUrl(data.coverImage || "");
        setCoverPositionX(Number.isFinite(Number(data.coverPositionX)) ? Number(data.coverPositionX) : 50);
        setCoverPositionY(Number.isFinite(Number(data.coverPositionY)) ? Number(data.coverPositionY) : 50);
      } else if (response.status === 404) {
        setError("Book not found");
      } else {
        setError("Error fetching book");
      }
    } catch (err) {
      setError("Error fetching book");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    let currentCoverUrl = coverUrl;

    // Upload new cover if one was selected
    if (coverRef.current?.files?.[0]) {
      const formData = new FormData();
      formData.append("cover", coverRef.current.files[0]);
      try {
        const uploadRes = await fetch(`${API_URL}/api/books/${id}/cover`, {
          method: "POST",
          credentials: "include",
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          currentCoverUrl = uploadData.url;
          setCoverUrl(currentCoverUrl);
          setCoverPreview(`${API_URL}${currentCoverUrl}`);
        } else {
          const errData = await uploadRes.json();
          setError(errData.message || "Error uploading cover");
          return;
        }
      } catch (err) {
        setError("Error uploading cover");
        return;
      }
    }

    const updateData = {
      title: titleRef.current.value,
      author: authorRef.current.value,
      description: descriptionRef.current.value,
      quantity: parseInt(quantityRef.current.value),
      available: parseInt(availableRef.current.value),
      location: locationRef.current.value,
      coverImage: currentCoverUrl,
      coverPositionX,
      coverPositionY
    };

    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setMessage("Book updated successfully");
        fetchBook();
      } else {
        const data = await response.json();
        setError(data.message || "Error updating book");
      }
    } catch (err) {
      setError("Error updating book");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        navigate("/books");
      } else {
        const data = await response.json();
        setError(data.message || "Error deleting book");
      }
    } catch (err) {
      setError("Error deleting book");
    }
  };

  const handleRestore = async () => {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "ACTIVE" })
      });

      if (response.ok) {
        setMessage("Book restored successfully");
        fetchBook();
      } else {
        const data = await response.json();
        setError(data.message || "Error restoring book");
      }
    } catch (err) {
      setError("Error restoring book");
    }
  };

  if (loading) return <div>Loading book details...</div>;
  if (error && !book) return <div style={{ color: "#ef4444", padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "8px" }}>{error}</div>;

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCover = async () => {
    if (!coverUrl) return;
    try {
      const response = await fetch(`${API_URL}/api/books/${id}/cover`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Error removing cover");
        return;
      }

      setCoverPreview(null);
      setCoverUrl("");
      setCoverPositionX(50);
      setCoverPositionY(50);
      setMessage("Cover removed successfully");
      if (coverRef.current) coverRef.current.value = "";
    } catch (err) {
      setError("Error removing cover");
    }
  };

  return (
    <div className="card" style={{ maxWidth: "800px" }}>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ marginBottom: 0 }}>Edit Book</h2>
        <Link to="/books" className="app-nav-link">← Back to Books</Link>
      </div>
      
      {error && <div style={{ color: "#ef4444", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>{error}</div>}
      {message && <div style={{ color: "#059669", backgroundColor: "#d1fae5", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>{message}</div>}
      
      {book && (
        <form onSubmit={handleUpdate}>
          <div className="flex gap-4 mb-4">
            <div className="w-full">
              <label>Title</label>
              <input type="text" ref={titleRef} defaultValue={book.title} required />
            </div>
            <div className="w-full">
              <label>Author</label>
              <input type="text" ref={authorRef} defaultValue={book.author} required />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-full">
              <label>ISBN</label>
              <input type="text" defaultValue={book.isbn} disabled style={{ backgroundColor: "#f3f4f6" }} />
              <small style={{ color: "#6b7280" }}>ISBN cannot be changed</small>
            </div>
            <div className="w-full">
              <label>Location</label>
              <input type="text" ref={locationRef} defaultValue={book.location} placeholder="e.g., Shelf A-1" />
            </div>
          </div>

          <div className="mb-4">
            <label>Description</label>
            <textarea ref={descriptionRef} defaultValue={book.description} rows="3" />
          </div>

          <div className="mb-4">
            <label>Book Cover</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  style={{ width: "120px", height: "160px", objectFit: "cover", objectPosition: `${coverPositionX}% ${coverPositionY}%`, borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
              )}
              <div>
                <input type="file" ref={coverRef} accept="image/jpeg,image/png,image/webp" onChange={handleCoverSelect} style={{ fontSize: "0.9rem" }} />
                {coverPreview && (
                  <div style={{ marginTop: "0.75rem", minWidth: "240px" }}>
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
                {coverUrl && (
                  <button type="button" className="danger" onClick={handleRemoveCover} style={{ marginTop: "0.5rem", fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
                    Remove Cover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex gap-4 w-full">
              <div className="w-full">
                <label>Total Quantity</label>
                <input type="number" ref={quantityRef} defaultValue={book.quantity} min="0" />
              </div>
              <div className="w-full">
                <label>Available</label>
                <input type="number" ref={availableRef} defaultValue={book.available} min="0" />
              </div>
            </div>
            <div className="w-full">
              <label>Status</label>
              <div style={{ paddingTop: "0.5rem" }}>
                <span className={`badge ${book.status === 'DELETED' ? 'deleted' : 'active'}`}>
                  {book.status || "ACTIVE"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-4" style={{ paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
            <button type="submit">Update Book</button>
            {book.status === "DELETED" ? (
              <button type="button" className="secondary" onClick={handleRestore}>
                Restore Book
              </button>
            ) : (
              <button type="button" className="danger" onClick={handleDelete}>
                Delete Book
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}