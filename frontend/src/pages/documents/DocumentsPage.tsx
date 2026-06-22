import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../api';
import toast from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocItem {
  _id: string;
  filename: string;
  url: string;
  status: string;
  createdAt?: string;
  size?: number;
}

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Preview State
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      // The API might return an array or an object containing an array.
      if (Array.isArray(res.data)) {
        setDocuments(res.data);
      } else if (res.data && Array.isArray(res.data.documents)) {
        setDocuments(res.data.documents);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to fetch documents', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('document', file);
      
      const loadingToast = toast.loading('Uploading document...');
      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Document uploaded successfully', { id: loadingToast });
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to upload document', { id: loadingToast });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const isPDF = (filename: string) => filename.toLowerCase().endsWith('.pdf');

  const formatBytes = (bytes: number = 0, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <Button leftIcon={<Upload size={18} />} onClick={handleUploadClick}>
          Upload Document
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">12.5 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">7.5 GB</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Recent Files
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Shared with Me
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No documents found. Upload one to get started.</div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename}
                          </h3>
                          <Badge variant="secondary" size="sm">{doc.status}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{isPDF(doc.filename) ? 'PDF' : 'File'}</span>
                          {doc.size && <span>{formatBytes(doc.size)}</span>}
                          {doc.createdAt && <span>Added {formatDate(doc.createdAt)}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {isPDF(doc.filename) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            aria-label="Preview"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye size={18} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="Download"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          aria-label="Delete"
                          onClick={() => handleDelete(doc._id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                {previewDoc.filename}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)} className="p-2">
                <X size={20} />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center items-start">
              <Document
                file={previewDoc.url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                }
                error={
                  <div className="p-8 text-center text-error-600">
                    Failed to load PDF.
                  </div>
                }
              >
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                  width={Math.min(window.innerWidth * 0.8, 800)}
                />
              </Document>
            </div>
            
            {numPages && numPages > 1 && (
              <div className="p-3 border-t border-gray-200 flex justify-center items-center gap-4 bg-white">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};