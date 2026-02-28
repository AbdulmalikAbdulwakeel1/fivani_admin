import { useState } from 'react';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineEye,
  HiOutlinePhoto, HiOutlineVideoCamera, HiOutlineTag, HiOutlineClock,
} from 'react-icons/hi2';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { useApi } from '../../hooks/useApi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    [{ align: [] }],
    ['clean'],
  ],
};

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [contentValue, setContentValue] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Tag management
  const [showTagModal, setShowTagModal] = useState(false);
  const [editTag, setEditTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagSubmitting, setTagSubmitting] = useState(false);

  const { data: categoriesData, refetch: refetchCategories } = useApi('/admin/blog/categories', {}, []);
  const categories = categoriesData || [];

  const { data: tagsData, refetch: refetchTags } = useApi('/admin/blog/tags', {}, []);
  const tags = tagsData || [];

  const { data: listData, loading, refetch } = useApi(
    '/admin/blog',
    {
      page,
      per_page: 15,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(categoryFilter ? { category_id: categoryFilter } : {}),
      ...(tagFilter ? { tag_id: tagFilter } : {}),
    },
    [page, search, statusFilter, categoryFilter, tagFilter]
  );

  const posts = listData?.data || [];
  const totalPages = listData?.last_page || 1;
  const total = listData?.total || 0;

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting, errors } } = useForm();

  const openCreate = () => {
    setEditPost(null);
    reset({ title: '', excerpt: '', video_url: '', status: 'draft', category_id: '', read_time: '' });
    setContentValue('');
    setSelectedTagIds([]);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (post) => {
    setEditPost(post);
    setValue('title', post.title);
    setValue('excerpt', post.excerpt || '');
    setValue('video_url', post.video_url || '');
    setValue('status', post.status);
    setValue('category_id', post.category_id || '');
    setValue('read_time', post.read_time || '');
    setContentValue(post.content || '');
    setSelectedTagIds(post.tags?.map((t) => t.id) || []);
    setImageFile(null);
    setImagePreview(post.featured_image || '');
    setShowModal(true);
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, WebP, and SVG images are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleTagSelection = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const onSubmit = async (formData) => {
    if (!contentValue || contentValue === '<p><br></p>') {
      toast.error('Content is required');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', contentValue);
      if (formData.excerpt) fd.append('excerpt', formData.excerpt);
      if (formData.video_url) fd.append('video_url', formData.video_url);
      if (formData.read_time) fd.append('read_time', formData.read_time);
      fd.append('status', formData.status);
      if (formData.category_id) fd.append('category_id', formData.category_id);
      if (imageFile) fd.append('featured_image', imageFile);
      selectedTagIds.forEach((id) => fd.append('tag_ids[]', id));

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
      setContentValue('');
      setSelectedTagIds([]);
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

  // ── Category CRUD ───────────────────────────────────────────────────
  const openCreateCategory = () => {
    setEditCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error('Category name is required');
    setCategorySubmitting(true);
    try {
      if (editCategory) {
        await api.put(`/admin/blog/categories/${editCategory.id}`, { name: categoryName, description: categoryDesc });
        toast.success('Category updated');
      } else {
        await api.post('/admin/blog/categories', { name: categoryName, description: categoryDesc });
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      setEditCategory(null);
      setCategoryName('');
      setCategoryDesc('');
      refetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.errors?.name?.[0] || err.response?.data?.message || 'Failed to save category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Posts in this category will become uncategorized.')) return;
    try {
      await api.delete(`/admin/blog/categories/${id}`);
      toast.success('Category deleted');
      refetchCategories();
      refetch();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  // ── Tag CRUD ────────────────────────────────────────────────────────
  const openTagManager = () => {
    setEditTag(null);
    setTagName('');
    setShowTagModal(true);
  };

  const openEditTag = (tag) => {
    setEditTag(tag);
    setTagName(tag.name);
    setShowTagModal(true);
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return toast.error('Tag name is required');
    setTagSubmitting(true);
    try {
      if (editTag) {
        await api.put(`/admin/blog/tags/${editTag.id}`, { name: tagName });
        toast.success('Tag updated');
      } else {
        await api.post('/admin/blog/tags', { name: tagName });
        toast.success('Tag created');
      }
      setEditTag(null);
      setTagName('');
      refetchTags();
    } catch (err) {
      toast.error(err.response?.data?.errors?.name?.[0] || err.response?.data?.message || 'Failed to save tag');
    } finally {
      setTagSubmitting(false);
    }
  };

  const handleDeleteTag = async (id) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await api.delete(`/admin/blog/tags/${id}`);
      toast.success('Tag deleted');
      refetchTags();
      refetch();
    } catch {
      toast.error('Failed to delete tag');
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
      key: 'category',
      label: 'Category',
      render: (val) => val ? (
        <Badge variant="info">{val.name}</Badge>
      ) : (
        <span className="text-xs text-gray-400">Uncategorized</span>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (val) => val?.length ? (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 3).map((t) => (
            <Badge key={t.id} variant="purple">{t.name}</Badge>
          ))}
          {val.length > 3 && <span className="text-xs text-gray-400">+{val.length - 3}</span>}
        </div>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      ),
    },
    {
      key: 'read_time',
      label: 'Read',
      render: (val) => val ? (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <HiOutlineClock className="w-3 h-3" /> {val} min
        </span>
      ) : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'published' ? 'success' : 'warning'}>{val}</Badge>
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
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name} ({cat.posts_count ?? 0})</option>
            ))}
          </select>
          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name} ({tag.posts_count ?? 0})</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-4 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
          />
          <button
            onClick={openCreateCategory}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors dark:text-white"
            title="Manage Categories"
          >
            <HiOutlineTag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={openTagManager}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors dark:text-white"
            title="Manage Tags"
          >
            <HiOutlineTag className="w-4 h-4" />
            Tags
          </button>
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

      {/* Create/Edit Post Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditPost(null); reset(); setContentValue(''); setSelectedTagIds([]); }} title={editPost ? 'Edit Blog Post' : 'New Blog Post'} size="xl">
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
            <div className="blog-editor">
              <ReactQuill
                theme="snow"
                value={contentValue}
                onChange={setContentValue}
                modules={quillModules}
                placeholder="Write your blog content here..."
                style={{ minHeight: '200px' }}
              />
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category</label>
              <select
                {...register('category_id')}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Read Time (min)</label>
              <input
                {...register('read_time')}
                type="number"
                min="1"
                max="999"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
                placeholder="Auto-calculated if empty"
              />
            </div>
          </div>

          {/* Tags selection */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Tags</label>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400">No tags created yet. Use the Tags button to create some.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagSelection(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Featured Image</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditPost(null); reset(); setContentValue(''); setSelectedTagIds([]); }}
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
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>By {previewPost.author?.fullname || 'Admin'}</span>
              <span>&middot;</span>
              <span>{previewPost.published_at?.slice(0, 10) || previewPost.created_at?.slice(0, 10)}</span>
              {previewPost.read_time && (
                <span className="flex items-center gap-1"><HiOutlineClock className="w-3.5 h-3.5" /> {previewPost.read_time} min read</span>
              )}
              <Badge variant={previewPost.status === 'published' ? 'success' : 'warning'}>{previewPost.status}</Badge>
              {previewPost.category && (
                <Badge variant="info">{previewPost.category.name}</Badge>
              )}
            </div>
            {previewPost.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewPost.tags.map((t) => (
                  <Badge key={t.id} variant="purple">{t.name}</Badge>
                ))}
              </div>
            )}
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
              <div
                className="text-sm dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: previewPost.content }}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Category Management Modal */}
      <Modal open={showCategoryModal} onClose={() => { setShowCategoryModal(false); setEditCategory(null); }} title={editCategory ? 'Edit Category' : 'Manage Categories'} size="lg">
        <div className="space-y-4">
          <form onSubmit={handleCategorySubmit} className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
            <h4 className="text-sm font-medium dark:text-gray-200">{editCategory ? 'Update Category' : 'Add New Category'}</h4>
            <div>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
                placeholder="Category name"
              />
            </div>
            <div>
              <input
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
                placeholder="Description (optional)"
              />
            </div>
            <div className="flex gap-2">
              {editCategory && (
                <button
                  type="button"
                  onClick={() => { setEditCategory(null); setCategoryName(''); setCategoryDesc(''); }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {categorySubmitting ? 'Saving...' : editCategory ? 'Update' : 'Add Category'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.posts_count ?? 0} posts{cat.description ? ` · ${cat.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditCategory(cat)} className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Tag Management Modal */}
      <Modal open={showTagModal} onClose={() => { setShowTagModal(false); setEditTag(null); setTagName(''); }} title={editTag ? 'Edit Tag' : 'Manage Tags'} size="lg">
        <div className="space-y-4">
          <form onSubmit={handleTagSubmit} className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
            <h4 className="text-sm font-medium dark:text-gray-200">{editTag ? 'Update Tag' : 'Add New Tag'}</h4>
            <div>
              <input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3498db] dark:text-white"
                placeholder="Tag name"
              />
            </div>
            <div className="flex gap-2">
              {editTag && (
                <button
                  type="button"
                  onClick={() => { setEditTag(null); setTagName(''); }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={tagSubmitting}
                className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {tagSubmitting ? 'Saving...' : editTag ? 'Update' : 'Add Tag'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No tags yet</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{tag.name}</p>
                    <p className="text-xs text-gray-400">{tag.posts_count ?? 0} posts</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditTag(tag)} className="p-1.5 text-[#3498db] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTag(tag.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
