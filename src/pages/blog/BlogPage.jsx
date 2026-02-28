import { useState } from 'react';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye,
  HiOutlinePhoto, HiOutlineVideoCamera, HiOutlineDocumentText,
} from 'react-icons/hi2';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const { data: listData, loading, refetch } = useApi(
    '/admin/blog',
    { page, per_page: 15, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
    [page, search, statusFilter]
  );

  const posts = listData?.data || [];
  const totalPages = listData?.last_page || 1;
  const total = listData?.total || 0;

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting, errors } } = useForm();

  const openCreate = () => {
    setEditPost(null);
    reset({ title: '', content: '', excerpt: '', video_url: '', status: 'draft' });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setValue('title', post.title);
    setValue('content', post.content);
    setValue('excerpt', post.excerpt || '');
    setValue('video_url', post.video_url || '');
    setValue('status', post.status);
    setImageFile(null);
    setImagePreview(post.featured_image || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (formData) => {
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      if (formData.excerpt) fd.append('excerpt', formData.excerpt);
      if (formData.video_url) fd.append('video_url', formData.video_url);
      fd.append('status', formData.status);
      if (imageFile) fd.append('featured_image', imageFile);

      if (editPost) {
        fd.append('_method', 'PUT');
        await api.post(`/admin/blog/${editPost.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Blog post updated!');
      } else {
        await api.post('/admin/blog', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Blog post created!');
      }
      setShowModal(false);
      setEditPost(null);
      reset();
      setImageFile(null);
      setImagePreview('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      await api.delete(`/admin/blog/${id}`);
      toast.success('Blog post deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const { data } = await api.patch(`/admin/blog/${id}/toggle-publish`);
      toast.success(data.message || 'Status updated');
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'featured_image',
      label: '',
      render: (val) => val ? (
        <img src={val} alt="" className="w-12 h-12 rounded-lg object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <HiOutlinePhoto className="w-5 h-5 text-gray-400" />
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (val, row) => (
        <div>
          <p className="font-medium text-sm dark:text-white">{val}</p>
          <p className="text-xs text-gray-400">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'author',
      label: 'Author',
      render: (val) => <span className="text-sm dark:text-gray-200">{val?.fullname || val?.name || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'published' ? 'success' : 'warning'}>{val}</Badge>
      ),
    },
    {
      key: 'video_url',
      label: 'Media',
      render: (val, row) => (
        <div className="flex items-center gap-1">
          {row.featured_image && <HiOutlinePhoto className="w-4 h-4 text-blue-500" title="Has image" />}
          {val && <HiOutlineVideoCamera className="w-4 h-4 text-purple-500" title="Has video" />}
          {!row.featured_image && !val && <span className="text-xs text-gray-400">Text only</span>}
        </div>
      ),
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (val) => val ? val.slice(0, 10) : <span className="text-gray-400 text-xs">Not published</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPreviewPost(row)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Preview"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
            title="Edit"
          >
            <HiOutlinePencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleTogglePublish(row.id)}
            className={`text-xs px-2 py-1 rounded transition-colors ${row.status === 'published'
              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
            }`}
          >
            {row.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Blog Posts</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-4 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <DataTable
          columns={columns}
          data={posts}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          emptyMessage="No blog posts yet"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditPost(null); reset(); }} title={editPost ? 'Edit Blog Post' : 'New Blog Post'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Title *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              placeholder="Blog post title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Content *</label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={8}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white resize-y"
              placeholder="Write your blog content here..."
            />
            {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Excerpt</label>
            <textarea
              {...register('excerpt')}
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white resize-y"
              placeholder="Short summary of the post (optional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Featured Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#3498db]/10 file:text-[#3498db] hover:file:bg-[#3498db]/20 dark:text-gray-300"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Video URL</label>
              <input
                {...register('video_url')}
                type="url"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Status</label>
            <select
              {...register('status')}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditPost(null); reset(); }}
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editPost ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewPost} onClose={() => setPreviewPost(null)} title="Post Preview" size="xl">
        {previewPost && (
          <div className="space-y-4">
            {previewPost.featured_image && (
              <img src={previewPost.featured_image} alt={previewPost.title} className="w-full h-64 object-cover rounded-xl" />
            )}
            <h2 className="text-2xl font-bold dark:text-white">{previewPost.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>By {previewPost.author?.fullname || 'Admin'}</span>
              <span>&middot;</span>
              <span>{previewPost.published_at?.slice(0, 10) || previewPost.created_at?.slice(0, 10)}</span>
              <Badge variant={previewPost.status === 'published' ? 'success' : 'warning'}>{previewPost.status}</Badge>
            </div>
            {previewPost.excerpt && (
              <p className="text-gray-600 dark:text-gray-400 italic">{previewPost.excerpt}</p>
            )}
            {previewPost.video_url && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineVideoCamera className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium dark:text-gray-200">Video</span>
                </div>
                <a href={previewPost.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3498db] hover:underline break-all">
                  {previewPost.video_url}
                </a>
              </div>
            )}
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm dark:text-gray-300">{previewPost.content}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
