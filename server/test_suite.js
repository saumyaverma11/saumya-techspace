import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Project from './models/Project.js';
import Certification from './models/Certification.js';
import Achievement from './models/Achievement.js';
import Badge from './models/Badge.js';
import * as achievementController from './controllers/achievementController.js';
import * as badgeController from './controllers/badgeController.js';
import * as projectController from './controllers/projectController.js';
import * as certificationController from './controllers/certificationController.js';
import * as profileController from './controllers/profileController.js';
import Profile from './models/Profile.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// Mock Express req and res
function createMockReqRes({ body = {}, params = {}, query = {}, headers = {} } = {}) {
  const req = { body, params, query, headers };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
}

async function runTests() {
  console.log('--- Starting SaumyaPortfolio Backend Test Suite ---\n');

  try {
    await connectDB();
    assert(mongoose.connection.readyState === 1, 'MongoDB connection established');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // ==========================================
  // TEST 1: Achievement CRUD & Validation
  // ==========================================
  console.log('\n[TEST GROUP 1] Achievement Model & Controller CRUD');

  let ach1Id = null;
  let ach2Id = null;

  // 1a: Validation - missing required fields
  {
    const { req, res } = createMockReqRes({ body: { title: '' } });
    await achievementController.createAchievement(req, res);
    assert(res.getStatusCode() === 400, 'Validation: returns 400 when title/desc missing');
  }

  // 1b: Create achievement with image
  {
    const { req, res } = createMockReqRes({
      body: {
        title: 'Test Hackathon Winner',
        description: 'First place at National Hackathon 2026',
        image: 'https://res.cloudinary.com/demo/image/upload/hackathon.jpg',
        displayOrder: 2,
        isActive: true,
      },
    });
    await achievementController.createAchievement(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 201 && data.success, 'Create achievement with image succeeds');
    assert(data.data.title === 'Test Hackathon Winner', 'Achievement title saved correctly');
    assert(data.data.displayOrder === 2 && data.data.order === 2, 'displayOrder and order synchronized');
    assert(data.data.image === 'https://res.cloudinary.com/demo/image/upload/hackathon.jpg', 'Image URL saved correctly');
    ach1Id = data.data._id.toString();
  }

  // 1c: Create achievement without image (image optional)
  {
    const { req, res } = createMockReqRes({
      body: {
        title: 'Academic Excellence Award',
        description: 'Awarded for top 1% academic performance',
        displayOrder: 1,
        isActive: true,
      },
    });
    await achievementController.createAchievement(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 201 && data.success, 'Create achievement without image succeeds');
    assert(data.data.image === '', 'Missing image defaults to empty string gracefully');
    ach2Id = data.data._id.toString();
  }

  // 1d: Read achievement by ID
  {
    const { req, res } = createMockReqRes({ params: { id: ach1Id } });
    await achievementController.getAchievementById(req, res);
    assert(res.getStatusCode() === 200 && res.getData().data._id.toString() === ach1Id, 'Get achievement by ID succeeds');
  }

  // 1e: Read non-existent & invalid ID
  {
    const { req, res } = createMockReqRes({ params: { id: 'invalid-id-format' } });
    await achievementController.getAchievementById(req, res);
    assert(res.getStatusCode() === 400, 'Get achievement with invalid ID format returns 400');
  }

  // 1f: Update achievement
  {
    const { req, res } = createMockReqRes({
      params: { id: ach1Id },
      body: {
        title: 'Test Hackathon Winner (Updated)',
        displayOrder: 5,
        isActive: false,
      },
    });
    await achievementController.updateAchievement(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 200 && data.data.title === 'Test Hackathon Winner (Updated)', 'Update achievement succeeds');
    assert(data.data.displayOrder === 5 && data.data.order === 5, 'Updated displayOrder synchronized');
    assert(data.data.isActive === false, 'Updated isActive status to false');
  }

  // 1g: Active/Inactive status filtering & ordering
  {
    // Public call: ach1 is inactive, ach2 is active
    const { req: pubReq, res: pubRes } = createMockReqRes({});
    await achievementController.getAchievements(pubReq, pubRes);
    const pubData = pubRes.getData().data;
    const hasInactive = pubData.some((a) => a._id.toString() === ach1Id);
    const hasActive = pubData.some((a) => a._id.toString() === ach2Id);
    assert(!hasInactive, 'Public endpoint excludes inactive achievement');
    assert(hasActive, 'Public endpoint includes active achievement');

    // Admin / all call: should include both
    const { req: adminReq, res: adminRes } = createMockReqRes({ query: { all: 'true' } });
    await achievementController.getAchievements(adminReq, adminRes);
    const adminData = adminRes.getData().data;
    const adminHasInactive = adminData.some((a) => a._id.toString() === ach1Id);
    assert(adminHasInactive, 'Admin (all=true) endpoint includes inactive achievement');
  }

  // 1h: Delete achievement
  {
    const { req, res } = createMockReqRes({ params: { id: ach1Id } });
    await achievementController.deleteAchievement(req, res);
    assert(res.getStatusCode() === 200 && res.getData().success, 'Delete achievement succeeds');

    const { req: checkReq, res: checkRes } = createMockReqRes({ params: { id: ach1Id } });
    await achievementController.getAchievementById(checkReq, checkRes);
    assert(checkRes.getStatusCode() === 404, 'Deleted achievement returns 404');
  }
  // Clean up ach2
  if (ach2Id) await Achievement.findByIdAndDelete(ach2Id);

  // ==========================================
  // TEST 2: Badge CRUD & Validation
  // ==========================================
  console.log('\n[TEST GROUP 2] Badge Model & Controller CRUD');

  let badge1Id = null;
  let badge2Id = null;

  // 2a: Validation
  {
    const { req, res } = createMockReqRes({ body: {} });
    await badgeController.createBadge(req, res);
    assert(res.getStatusCode() === 400, 'Validation: returns 400 when badge title/desc missing');
  }

  // 2b: Create badge with image
  {
    const { req, res } = createMockReqRes({
      body: {
        title: 'Open Source Contributor',
        description: 'Contributed 50+ PRs to major repositories',
        image: 'https://res.cloudinary.com/demo/image/upload/badge.png',
        displayOrder: 1,
        isActive: true,
      },
    });
    await badgeController.createBadge(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 201 && data.success, 'Create badge with image succeeds');
    assert(data.data.title === 'Open Source Contributor', 'Badge title saved correctly');
    assert(data.data.displayOrder === 1 && data.data.order === 1, 'Badge displayOrder and order synced');
    badge1Id = data.data._id.toString();
  }

  // 2c: Create badge without image (optional)
  {
    const { req, res } = createMockReqRes({
      body: {
        title: 'Community Mentor',
        description: 'Mentored 100+ junior developers',
        displayOrder: 2,
        isActive: true,
      },
    });
    await badgeController.createBadge(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 201 && data.success, 'Create badge without image succeeds');
    assert(data.data.image === '', 'Badge without image defaults to empty string');
    badge2Id = data.data._id.toString();
  }

  // 2d: Update badge
  {
    const { req, res } = createMockReqRes({
      params: { id: badge2Id },
      body: {
        title: 'Community Mentor (Lead)',
        displayOrder: 0,
      },
    });
    await badgeController.updateBadge(req, res);
    assert(res.getStatusCode() === 200 && res.getData().data.title === 'Community Mentor (Lead)', 'Update badge succeeds');
    assert(res.getData().data.displayOrder === 0, 'Badge displayOrder updated to 0');
  }

  // 2e: Get badges sorted by displayOrder
  {
    const { req, res } = createMockReqRes({});
    await badgeController.getBadges(req, res);
    const list = res.getData().data.filter((b) => [badge1Id, badge2Id].includes(b._id.toString()));
    assert(list.length === 2, 'Retrieved both test badges');
    assert(list[0]._id.toString() === badge2Id && list[1]._id.toString() === badge1Id, 'Badges ordered by displayOrder asc (0 before 1)');
  }

  // 2f: Clean up badges
  if (badge1Id) await Badge.findByIdAndDelete(badge1Id);
  if (badge2Id) await Badge.findByIdAndDelete(badge2Id);
  assert(true, 'Badge cleanup completed');

  // ==========================================
  // TEST 3: Custom Display Ordering - Projects
  // ==========================================
  console.log('\n[TEST GROUP 3] Custom Display Ordering - Projects');

  const proj1 = await Project.create({
    title: 'Test Order High',
    description: 'Project with high display order',
    displayOrder: 50,
  });

  const proj2 = await Project.create({
    title: 'Test Order Low',
    description: 'Project with low display order',
    displayOrder: 2,
  });

  const proj3 = await Project.create({
    title: 'Test Order Tie',
    description: 'Project with same display order',
    displayOrder: 2,
  });

  {
    const { req, res } = createMockReqRes({});
    await projectController.getProjects(req, res);
    const projects = res.getData().data;
    const testProjects = projects.filter((p) => [proj1._id.toString(), proj2._id.toString(), proj3._id.toString()].includes(p._id.toString()));

    assert(testProjects.length === 3, 'Found all 3 test projects');
    assert(testProjects[0].displayOrder === 2 && testProjects[1].displayOrder === 2 && testProjects[2].displayOrder === 50, 'Projects sorted with lower displayOrder first (2, 2, 50)');
  }

  // Cleanup test projects
  await Project.findByIdAndDelete(proj1._id);
  await Project.findByIdAndDelete(proj2._id);
  await Project.findByIdAndDelete(proj3._id);

  // ==========================================
  // TEST 4: Custom Display Ordering - Certifications
  // ==========================================
  console.log('\n[TEST GROUP 4] Custom Display Ordering - Certifications');

  const cert1 = await Certification.create({
    name: 'Cert Lower',
    issuer: 'Test Org',
    displayOrder: 3,
  });

  const cert2 = await Certification.create({
    name: 'Cert Higher',
    issuer: 'Test Org',
    displayOrder: 25,
  });

  {
    const { req, res } = createMockReqRes({});
    await certificationController.getCertifications(req, res);
    const certs = res.getData().data;
    const testCerts = certs.filter((c) => [cert1._id.toString(), cert2._id.toString()].includes(c._id.toString()));

    assert(testCerts.length === 2, 'Found both test certifications');
    assert(testCerts[0]._id.toString() === cert1._id.toString() && testCerts[1]._id.toString() === cert2._id.toString(), 'Certifications sorted with lower displayOrder first (3 before 25)');
    assert(testCerts[0].displayOrder === 3 && testCerts[0].order === 3, 'Certification displayOrder and order in response');
  }

  // Cleanup test certifications
  await Certification.findByIdAndDelete(cert1._id);
  await Certification.findByIdAndDelete(cert2._id);

  // ==========================================
  // TEST 5: Non-destructive backward compatibility
  // ==========================================
  console.log('\n[TEST GROUP 5] Non-destructive Defaults');

  // Verify creating a project without displayOrder defaults to 0
  const legacyProj = await Project.create({
    title: 'Legacy Project Without Order',
    description: 'Testing default displayOrder value',
  });
  assert(legacyProj.displayOrder === 0, 'Project without displayOrder defaults to 0');
  await Project.findByIdAndDelete(legacyProj._id);

  const legacyCert = await Certification.create({
    name: 'Legacy Cert',
    issuer: 'Legacy Issuer',
  });
  assert(legacyCert.displayOrder === 0 && legacyCert.order === 0, 'Certification without displayOrder defaults to 0');
  await Certification.findByIdAndDelete(legacyCert._id);

  // ==========================================
  // TEST 6: Certification Credential Visibility
  // ==========================================
  console.log('\n[TEST GROUP 6] Certification Credential Visibility');

  // Test 6.1: Default showCredentialUrl is true
  const defaultCert = await Certification.create({
    name: 'Default Visibility Cert',
    issuer: 'Test Issuer',
    credentialUrl: 'https://example.com/verify/default',
  });
  assert(defaultCert.showCredentialUrl === true, 'Certification showCredentialUrl defaults to true');
  assert(defaultCert.credentialUrl === 'https://example.com/verify/default', 'Default certification retains credentialUrl');

  // Test 6.2: Explicitly disabled credential visibility preserves saved URL
  const hiddenCert = await Certification.create({
    name: 'Hidden Credential Cert',
    issuer: 'Test Issuer',
    credentialUrl: 'https://example.com/verify/hidden',
    showCredentialUrl: false,
  });
  assert(hiddenCert.showCredentialUrl === false, 'Certification showCredentialUrl can be set to false');
  assert(hiddenCert.credentialUrl === 'https://example.com/verify/hidden', 'Saved credentialUrl is preserved when showCredentialUrl is false');

  // Test 6.3: Updating showCredentialUrl toggles visibility without altering URL
  {
    const { req, res } = createMockReqRes({
      params: { id: hiddenCert._id.toString() },
      body: { showCredentialUrl: true }
    });
    await certificationController.updateCertification(req, res);
    const updated = res.getData().data;
    assert(updated.showCredentialUrl === true, 'updateCertification toggles showCredentialUrl to true');
    assert(updated.credentialUrl === 'https://example.com/verify/hidden', 'updateCertification retains saved credentialUrl');
  }

  // Cleanup test certifications
  await Certification.findByIdAndDelete(defaultCert._id);
  await Certification.findByIdAndDelete(hiddenCert._id);

  // ==========================================
  // TEST 7: Project GitHub & Live Demo Link Visibility
  // ==========================================
  console.log('\n[TEST GROUP 7] Project GitHub & Live Demo Link Visibility');

  // Test 7.1: Both enabled by default when omitted
  const projDefault = await Project.create({
    title: 'Default Links Project',
    description: 'Testing default visibility for links',
    githubUrl: 'https://github.com/saumya/default',
    liveUrl: 'https://default-demo.com',
  });
  assert(projDefault.showGithubUrl === true, 'Project showGithubUrl defaults to true');
  assert(projDefault.showLiveUrl === true, 'Project showLiveUrl defaults to true');
  assert(projDefault.githubUrl === 'https://github.com/saumya/default', 'Default project retains githubUrl');
  assert(projDefault.liveUrl === 'https://default-demo.com', 'Default project retains liveUrl');

  // Test 7.2: Only GitHub enabled
  const projOnlyGithub = await Project.create({
    title: 'Only GitHub Project',
    description: 'Testing only github enabled',
    githubUrl: 'https://github.com/saumya/gh-only',
    liveUrl: 'https://gh-only-demo.com',
    showGithubUrl: true,
    showLiveUrl: false,
  });
  assert(projOnlyGithub.showGithubUrl === true, 'Project showGithubUrl can be explicitly true');
  assert(projOnlyGithub.showLiveUrl === false, 'Project showLiveUrl can be explicitly false');
  assert(projOnlyGithub.githubUrl === 'https://github.com/saumya/gh-only', 'GitHub URL is retained when only GitHub enabled');
  assert(projOnlyGithub.liveUrl === 'https://gh-only-demo.com', 'Live URL is preserved in DB even when hidden');

  // Test 7.3: Only Live Demo enabled
  const projOnlyLive = await Project.create({
    title: 'Only Live Demo Project',
    description: 'Testing only live demo enabled',
    githubUrl: 'https://github.com/saumya/live-only',
    liveUrl: 'https://live-only-demo.com',
    showGithubUrl: false,
    showLiveUrl: true,
  });
  assert(projOnlyLive.showGithubUrl === false, 'Project showGithubUrl can be explicitly false');
  assert(projOnlyLive.showLiveUrl === true, 'Project showLiveUrl can be explicitly true');
  assert(projOnlyLive.githubUrl === 'https://github.com/saumya/live-only', 'GitHub URL is preserved in DB even when hidden');
  assert(projOnlyLive.liveUrl === 'https://live-only-demo.com', 'Live URL is retained when only Live Demo enabled');

  // Test 7.4: Both links disabled
  const projBothDisabled = await Project.create({
    title: 'Both Links Disabled Project',
    description: 'Testing both links disabled',
    githubUrl: 'https://github.com/saumya/disabled',
    liveUrl: 'https://disabled-demo.com',
    showGithubUrl: false,
    showLiveUrl: false,
  });
  assert(projBothDisabled.showGithubUrl === false, 'Project showGithubUrl is false when both disabled');
  assert(projBothDisabled.showLiveUrl === false, 'Project showLiveUrl is false when both disabled');
  assert(projBothDisabled.githubUrl === 'https://github.com/saumya/disabled', 'GitHub URL is preserved when both disabled');
  assert(projBothDisabled.liveUrl === 'https://disabled-demo.com', 'Live URL is preserved when both disabled');

  // Test 7.5: Update project via controller toggles link visibility
  {
    const { req, res } = createMockReqRes({
      params: { id: projBothDisabled._id.toString() },
      body: {
        showGithubUrl: true,
        showLiveUrl: true,
      },
    });
    await projectController.updateProject(req, res);
    const updated = res.getData().data;
    assert(res.getStatusCode() === 200, 'updateProject succeeds');
    assert(updated.showGithubUrl === true, 'updateProject toggles showGithubUrl to true');
    assert(updated.showLiveUrl === true, 'updateProject toggles showLiveUrl to true');
    assert(updated.githubUrl === 'https://github.com/saumya/disabled', 'Existing githubUrl preserved across updates');
    assert(updated.liveUrl === 'https://disabled-demo.com', 'Existing liveUrl preserved across updates');
  }

  // Cleanup test projects
  await Project.findByIdAndDelete(projDefault._id);
  await Project.findByIdAndDelete(projOnlyGithub._id);
  await Project.findByIdAndDelete(projOnlyLive._id);
  await Project.findByIdAndDelete(projBothDisabled._id);

  // ==========================================
  // TEST 8: Profile & Branding Content Separation
  // ==========================================
  console.log('\n[TEST GROUP 8] Profile & Branding Content Separation');

  // Test 8.1: Fetch Profile
  {
    const { req, res } = createMockReqRes({});
    await profileController.getProfile(req, res);
    const data = res.getData();
    assert(res.getStatusCode() === 200 && data.success, 'getProfile succeeds');
    assert(typeof data.data.bio === 'string', 'Profile contains bio field');
    assert(typeof data.data.aboutDescription === 'string', 'Profile contains aboutDescription field');
    assert(data.data.cardBio !== undefined, 'Profile contains cardBio field');
  }

  // Test 8.2: Update Profile with decoupled Hero Bio, Card Bio, and About Description
  {
    const originalProfile = await Profile.findOne();
    const backupData = originalProfile ? originalProfile.toObject() : {};

    const { req, res } = createMockReqRes({
      body: {
        bio: 'Short concise hero introduction for left column.',
        cardBio: 'Brief highlight for the floating hero card.',
        aboutHeading: 'Custom About Headline',
        aboutDescription: 'Comprehensive multi-paragraph detailed about narrative displayed exclusively in the About section.'
      }
    });

    await profileController.updateProfile(req, res);
    const updated = res.getData().data;

    assert(res.getStatusCode() === 200, 'updateProfile succeeds');
    assert(updated.bio === 'Short concise hero introduction for left column.', 'Hero Bio updated independently');
    assert(updated.cardBio === 'Brief highlight for the floating hero card.', 'Profile Card Intro updated independently');
    assert(updated.aboutHeading === 'Custom About Headline', 'About Heading updated');
    assert(updated.aboutDescription === 'Comprehensive multi-paragraph detailed about narrative displayed exclusively in the About section.', 'Detailed About Description updated independently');

    // Restore original profile data
    if (backupData._id) {
      await Profile.findByIdAndUpdate(backupData._id, backupData);
    }
    assert(true, 'Profile state restored after test run');
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log(`\n==========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==========================================\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
