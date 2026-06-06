from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

import chromadb
import numpy as np
from sklearn.decomposition import PCA

EMPTY = {"pcaPoints": [], "pcaPoints3d": []}
GET_LIMIT = 300
_collection = None
CLIENT_DISCONNECT_ERRORS = (BrokenPipeError, ConnectionAbortedError, ConnectionResetError)


def _get_collection():
    global _collection
    if _collection is not None:
        return _collection

    client = chromadb.HttpClient(
        host=os.environ["CHROMA_HOST"],
        port=8000,
        ssl=True,
        tenant=os.environ["CHROMA_TENANT"],
        database=os.environ["CHROMA_DATABASE"],
        headers={"X-Chroma-Token": os.environ["CHROMA_API_KEY"]},
    )
    _collection = client.get_or_create_collection("expressions")
    return _collection


def _get_vectors(collection, show_all, user_email):
    ids = []
    embeddings = []
    documents = []
    offset = 0

    while True:
        get_kwargs = {
            "include": ["embeddings", "documents"],
            "limit": GET_LIMIT,
            "offset": offset,
        }
        if not show_all:
            get_kwargs["where"] = {"userEmail": user_email}

        result = collection.get(**get_kwargs)
        batch_ids = result["ids"]
        ids.extend(batch_ids)
        embeddings.extend(result["embeddings"])
        documents.extend(result["documents"])

        if len(batch_ids) < GET_LIMIT:
            break
        offset += GET_LIMIT

    return ids, embeddings, documents


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = urlparse(self.path)
            query = parse_qs(url.query)
            show_all = query.get("all", [""])[0].lower() == "true" or url.path.startswith("/api/public/")
            user_email = query.get("userEmail", [""])[0].strip().lower()
            if not show_all and not user_email:
                self._send_json(EMPTY)
                return

            collection = _get_collection()
            ids, embeddings, documents = _get_vectors(collection, show_all, user_email)

            if len(ids) < 4:
                body = {
                    **EMPTY,
                    "totalVectors": len(ids),
                    "mode": "all" if show_all else "user",
                }
            else:
                matrix = np.array(embeddings, dtype=float)
                n3d = min(3, len(ids) - 1)
                coords = PCA(n_components=n3d).fit_transform(matrix)

                pca_points = [
                    {"x": float(coords[i][0]), "y": float(coords[i][1]), "text": documents[i]}
                    for i in range(len(ids))
                ]
                pca_points_3d = [
                    {
                        "x": float(coords[i][0]),
                        "y": float(coords[i][1]),
                        "z": float(coords[i][2]) if n3d >= 3 else 0.0,
                        "text": documents[i],
                    }
                    for i in range(len(ids))
                ]
                body = {
                    "pcaPoints": pca_points,
                    "pcaPoints3d": pca_points_3d,
                    "totalVectors": len(ids),
                    "mode": "all" if show_all else "user",
                }

            self._send_json(body)

        except CLIENT_DISCONNECT_ERRORS:
            pass
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=500)

    def _send_json(self, body, status=200):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        try:
            self.wfile.write(encoded)
        except CLIENT_DISCONNECT_ERRORS:
            pass

    def log_message(self, _format, *_args):
        pass


if __name__ == "__main__":
    from http.server import HTTPServer

    from dotenv import load_dotenv
    load_dotenv()

    port = int(os.environ.get("PORT", 8001))
    print(f"vectors server on :{port}", flush=True)
    HTTPServer(("localhost", port), handler).serve_forever()
