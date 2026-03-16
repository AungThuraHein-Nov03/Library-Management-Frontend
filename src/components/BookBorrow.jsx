import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import { Link, useSearchParams } from "react-router-dom";

export default function BookBorrow() {
  const [borrows, setBorrows] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchBorrows = async () => {
    try {
      const response = await fetch(`${API_URL}/api/borrow`, {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      }
    } catch (err) {
      setError("Error fetching borrow requests");
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/books`, {
        method: "GET",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (err) {
      console.error("Error fetching books");
    }
  };

  useEffect(() => {
    Promise.all([fetchBorrows(), fetchBooks()]).then(() => {
      setLoading(false);
      const bookId = searchParams.get("bookId");
      if (bookId) setSelectedBook(bookId);
    });
  }, []);

  const handleBorrowRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedBook) {
      setError("Please select a book");
      return;
    }

    if (!targetDate) {
      setError("Please select a target pickup date");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/borrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookId: selectedBook, targetDate })
      });

      if (response.ok) {
        setMessage("Borrow request submitted successfully");
        setSelectedBook("");
        setTargetDate("");
        fetchBorrows();
        fetchBooks();
      } else {
        const data = await response.json();
        setError(data.message || "Error creating borrow request");
      }
    } catch (err) {
      setError("Error creating borrow request");
    }
  };

  const handleStatusUpdate = async (borrowId, newStatus) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/borrow/${borrowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        fetchBorrows();
        fetchBooks();
      } else {
        const data = await response.json();
        setError(data.message || "Error updating status");
      }
    } catch (err) {
      setError("Error updating status");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ marginBottom: 0 }}>Borrow Requests</h2>
      </div>
      
      {error && <div style={{ color: "#ef4444", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>{error}</div>}
      {message && <div style={{ color: "#059669", backgroundColor: "#d1fae5", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>{message}</div>}
      
      {/* Borrow request form - available to USER role */}
      {user.role === "USER" && (
        <div className="card mb-4" style={{ maxWidth: "600px", marginLeft: 0 }}>
          <h3 style={{ marginBottom: "1rem" }}>Request a Book</h3>
          <form onSubmit={handleBorrowRequest}>
            <div className="form-group">
              <label>Select a Book</label>
              <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}>
                <option value="">-- Select a book --</option>
                {books.map((book) => (
                  <option key={book._id} value={book._id}>
                    {book.title} by {book.author} ({book.available} available)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Target Pickup Date</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </div>
            <button type="submit" className="w-full">Submit Request</button>
          </form>
        </div>
      )}
      
      {/* Borrow history */}
      <h3 className="mt-4">{user.role === "ADMIN" ? "All Borrow Requests" : "My Borrow Requests"}</h3>
      {borrows.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>No borrow requests found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th>
              {user.role === "ADMIN" && <th>User</th>}
              <th>Status</th>
              <th>Created At</th>
              <th>Target Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {borrows.map((borrow) => (
              <tr key={borrow._id}>
                <td><strong>{borrow.bookTitle}</strong></td>
                {user.role === "ADMIN" && <td>{borrow.userEmail}</td>}
                <td>
                  <span className={`badge ${
                    borrow.status === 'INIT' ? 'init' : 
                    borrow.status === 'ACCEPTED' ? 'accepted' : 
                    borrow.status.includes('CANCEL') || borrow.status.includes('CLOSE') ? 'deleted' : ''
                  }`}>
                    {borrow.status}
                  </span>
                </td>
                <td>{new Date(borrow.createdAt).toLocaleString()}</td>
                <td>{borrow.targetDate ? new Date(borrow.targetDate).toLocaleDateString() : "—"}</td>
                <td>
                  {borrow.status === "INIT" && user.role === "ADMIN" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(borrow._id, "ACCEPTED")}>Accept</button>
                      <button className="danger" onClick={() => handleStatusUpdate(borrow._id, "CANCEL-ADMIN")}>Cancel</button>
                    </div>
                  )}
                  {borrow.status === "INIT" && user.role === "USER" && (
                    <button className="danger" onClick={() => handleStatusUpdate(borrow._id, "CANCEL-USER")}>Cancel Request</button>
                  )}
                  {borrow.status !== "INIT" && <span style={{ color: "#9ca3af" }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}