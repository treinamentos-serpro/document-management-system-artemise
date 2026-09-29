function toPublicDocument(record) {
  return {
    id: record.id,
    originalName: record.originalName,
    size: record.size,
    uploadedAt: record.uploadedAt,
    owner: record.owner,
  };
}

module.exports = { toPublicDocument };
