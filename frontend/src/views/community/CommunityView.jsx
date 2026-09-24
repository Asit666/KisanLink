import React, { useState } from 'react';

/**
 * CommunityView — Kisan Sabha Farmer Community Bulletin & Discussions
 */
export default function CommunityView({
  text = {},
  communityPosts = [],
  onLikePost,
  onUpvoteAnswer,
  onAddReply,
  onOrderPrescriptionInput,
  onOpenNewPostModal
}) {
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [communityFilterCrop, setCommunityFilterCrop] = useState('ALL');
  const [communityParticipantFilter, setCommunityParticipantFilter] = useState('ALL');
  const [replyInputByPostId, setReplyInputByPostId] = useState({});

  function handleReplySubmit(postId) {
    const textVal = replyInputByPostId[postId]?.trim();
    if (!textVal) return;
    if (onAddReply) {
      onAddReply(postId, textVal);
    }
    setReplyInputByPostId(prev => ({ ...prev, [postId]: '' }));
  }

  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">{text.communityEyebrow || 'COMMUNITY KNOWLEDGE DESK & KISAN SABHA'}</p>
            <h2>{text.communitySection || 'Farmer Community & Crop Bulletin'}</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Open bulletin for crop health discussions, procurement notices, and agronomic advisories.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="trade-btn trade-btn-primary"
              onClick={onOpenNewPostModal}
              style={{ padding: '8px 18px', fontSize: '12px' }}
            >
              {text.communityNewDiscussion || '+ Start New Discussion'}
            </button>
          </div>
        </div>

        <div className="marketplace-toolbar" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                className="field-input"
                placeholder={text.communitySearchPlaceholder || 'Search discussions, symptoms, crops...'}
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
              {communitySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCommunitySearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#778078', fontSize: '11px', fontFamily: "'DM Mono', monospace" }}
                >
                  {text.communityClear || 'Clear'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>{text.communityCommodity || 'Crop:'}</span>
              <select
                className="field-input"
                value={communityFilterCrop}
                onChange={(e) => setCommunityFilterCrop(e.target.value)}
                style={{ fontSize: '12px', padding: '7px 10px', width: 'auto', minWidth: '130px' }}
              >
                <option value="ALL">{text.communityAllCommodities || 'All Crops'}</option>
                <option value="Tomato">Tomato</option>
                <option value="Chilli">Chilli / Pepper</option>
                <option value="Rice">Rice / Paddy</option>
                <option value="Potato">Potato</option>
                <option value="Wheat">Wheat</option>
                <option value="Mustard">Mustard</option>
                <option value="Cotton">Cotton</option>
                <option value="Onion">Onion</option>
              </select>
            </div>
          </div>

          <div className="category-filter-bar" style={{ margin: 0, paddingTop: '2px' }}>
            {[
              { value: 'ALL', label: text.communityAllTopics || 'All Topics' },
              { value: 'FARMER', label: text.communityFarmerQueries || 'Farmer Queries' },
              { value: 'BUYER', label: text.communityBuyerNotices || 'Buyer Notices' },
              { value: 'AGRONOMIST', label: text.communityAgronomistProtocols || 'Expert Solutions' }
            ].map(tab => (
              <button
                key={tab.value}
                type="button"
                className={`filter-chip ${communityParticipantFilter === tab.value ? 'active' : ''}`}
                onClick={() => setCommunityParticipantFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="community-feed">
          {communityPosts
            .filter(post => {
              const matchesParticipant = communityParticipantFilter === 'ALL' ||
                post.authorType === communityParticipantFilter ||
                post.answers.some(a => a.authorType === communityParticipantFilter);
              const matchesCrop = communityFilterCrop === 'ALL' ||
                post.cropName.toLowerCase().includes(communityFilterCrop.toLowerCase());
              const q = communitySearchQuery.toLowerCase().trim();
              const matchesSearch = !q ||
                post.title.toLowerCase().includes(q) ||
                post.description.toLowerCase().includes(q) ||
                post.authorName.toLowerCase().includes(q) ||
                post.cropName.toLowerCase().includes(q) ||
                post.answers.some(a => a.text.toLowerCase().includes(q) || a.authorName.toLowerCase().includes(q));
              return matchesParticipant && matchesCrop && matchesSearch;
            })
            .map((post) => {
              const postTypeLabel = post.postType === 'PROCUREMENT' ? 'BUYER PROCUREMENT' : (post.postType === 'QUALITY_ADVICE' ? 'QUALITY STANDARD' : (post.postType === 'AGRI_ADVICE' ? 'AGRONOMY ADVISORY' : 'CROP HEALTH'));

              return (
                <div key={post.id} className="community-post-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '4px', background: '#202a27', color: '#f6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                        {post.authorName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>{post.authorName}</strong>
                          <span style={{
                            fontSize: '9px',
                            fontFamily: "'DM Mono', monospace",
                            padding: '1px 5px',
                            borderRadius: '2px',
                            fontWeight: 600,
                            background: post.authorType === 'BUYER' ? '#eef2f8' : (post.authorType === 'AGRONOMIST' ? '#f5f2e8' : '#eef4ec'),
                            color: post.authorType === 'BUYER' ? '#204068' : (post.authorType === 'AGRONOMIST' ? '#685420' : '#2f6838')
                          }}>
                            {post.authorType} {post.authorRole ? `· ${post.authorRole}` : ''}
                          </span>
                        </div>
                        <span style={{ font: "10px 'DM Mono', monospace", color: '#778078' }}>
                          {post.location} &middot; {post.timestamp}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", background: '#f5f3eb', color: '#685420', padding: '2px 7px', borderRadius: '3px', fontWeight: 600 }}>
                        {post.cropName.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", background: '#eceae2', color: '#333b35', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                        [{postTypeLabel}]
                      </span>
                      {post.resolved && (
                        <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", background: '#e8f4ea', color: '#226330', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          [RESOLVED]
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', margin: '4px 0 4px', color: '#202a27', lineHeight: '1.4' }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#444d47', lineHeight: '1.55', margin: 0 }}>
                      {post.description}
                    </p>
                  </div>

                  {post.imageUrl && (
                    <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2ded4', maxWidth: '340px' }}>
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #edeae2', paddingTop: '8px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`endorse-btn ${post.userLiked ? 'endorsed' : ''}`}
                        onClick={() => onLikePost && onLikePost(post.id)}
                        title={post.userLiked ? 'Endorsed' : 'Endorse topic'}
                      >
                        <span style={{ fontSize: '12px' }}>{post.userLiked ? '✓' : '+'}</span>
                        <span>{post.likesCount}</span>
                      </button>

                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>
                        {post.answers.length} {post.answers.length === 1 ? (text.communityReplyCount || 'reply') : (text.communityReplyCountPlural || 'replies')}
                      </span>
                    </div>

                    {post.prescribedInput && (
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ fontSize: '10px', padding: '3px 8px' }}
                        onClick={() => onOrderPrescriptionInput && onOrderPrescriptionInput(post.prescribedInput)}
                      >
                        Order {post.prescribedInput.split(' ')[0]} &rarr;
                      </button>
                    )}
                  </div>

                  {post.answers.length > 0 && (
                    <div className="reply-thread">
                      {post.answers.map((ans) => (
                        <div
                          key={ans.id}
                          className={`reply-item ${ans.isVerifiedSolution ? 'verified-reply' : ''}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '12px', color: '#202a27' }}>{ans.authorName}</strong>
                              <span style={{
                                fontSize: '9px',
                                fontFamily: "'DM Mono', monospace",
                                background: ans.authorType === 'BUYER' ? '#eef2f8' : (ans.authorType === 'AGRONOMIST' ? '#2f6838' : '#e4e2d8'),
                                color: ans.authorType === 'BUYER' ? '#204068' : (ans.authorType === 'AGRONOMIST' ? '#ffffff' : '#333b35'),
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontWeight: 600
                              }}>
                                {ans.authorRole.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ font: "10px 'DM Mono', monospace", color: '#778078' }}>
                                {ans.timestamp}
                              </span>
                              <button
                                type="button"
                                className={`endorse-btn ${ans.userLiked ? 'endorsed' : ''}`}
                                onClick={() => onUpvoteAnswer && onUpvoteAnswer(post.id, ans.id)}
                                title="Endorse response"
                              >
                                <span style={{ fontSize: '11px' }}>{ans.userLiked ? '✓' : '+'}</span>
                                <span>{ans.upvotes || 0}</span>
                              </button>
                            </div>
                          </div>

                          {ans.isVerifiedSolution && (
                            <div style={{ display: 'inline-block', background: '#2f6838', color: '#ffffff', fontSize: '8px', fontFamily: "'DM Mono', monospace", padding: '1px 5px', borderRadius: '2px', fontWeight: 600, width: 'fit-content' }}>
                              VERIFIED AGRONOMIST PROTOCOL
                            </div>
                          )}

                          <p style={{ fontSize: '12px', color: '#2b332d', lineHeight: '1.5', margin: '2px 0', whiteSpace: 'pre-line' }}>
                            {ans.text}
                          </p>

                          {ans.prescribedInput && (
                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#566057' }}>Prescribed:</span>
                              <button
                                type="button"
                                className="prescription-btn"
                                style={{ padding: '2px 6px', fontSize: '9px' }}
                                onClick={() => onOrderPrescriptionInput && onOrderPrescriptionInput(ans.prescribedInput)}
                              >
                                Order {ans.prescribedInput} &rarr;
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder={text.communityAddReply || 'Write a helpful reply or recommendation...'}
                      value={replyInputByPostId[post.id] || ''}
                      onChange={(e) => setReplyInputByPostId(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReplySubmit(post.id); }}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      onClick={() => handleReplySubmit(post.id)}
                      style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      {text.communityReply || 'Reply'}
                    </button>
                  </div>
                </div>
              );
            })}

          {communityPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: '#faf9f5', borderRadius: '4px', border: '1px dashed #d9d6cc' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#202a27', margin: '0 0 4px' }}>
                {text.communityNoDiscussions || 'No community discussions active yet.'}
              </p>
              <p style={{ fontSize: '12px', color: '#778078', margin: '0 0 12px' }}>
                {text.communityNoDiscussionsSub || 'Be the first smallholder or agronomist to post a crop query!'}
              </p>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                onClick={onOpenNewPostModal}
              >
                {text.communityNewDiscussion || '+ Start New Discussion'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
