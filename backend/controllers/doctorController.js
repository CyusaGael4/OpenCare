import DoctorProfile from '../models/DoctorProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/HttpError.js';
import { sendSuccess } from '../utils/apiResponse.js';

function toPublicDoctor(profile) {
  return {
    id: profile._id.toString(),
    fullName: profile.user?.fullName ?? 'Doctor',
    email: profile.user?.email ?? null,
    phone: profile.user?.phone ?? null,
    specialization: profile.specialization ?? null,
    qualifications: profile.qualifications ?? [],
    experienceYears: profile.experienceYears ?? 0,
    biography: profile.biography ?? '',
    consultationDuration: profile.consultationDuration ?? 30,
    workingDays: profile.workingDays ?? [],
    workingHours: profile.workingHours ?? { start: '09:00', end: '17:00' },
    isAvailable: profile.isAvailable ?? true,
    isPublished: profile.isPublished ?? true,
  };
}

export const listPublicDoctors = asyncHandler(async (_req, res) => {
  const profiles = await DoctorProfile.find({ isPublished: true }).populate('user', 'fullName email phone profileImage');

  return sendSuccess(
    res,
    profiles.map((profile) => toPublicDoctor(profile)),
  );
});

export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id }).populate('user', 'fullName email phone profileImage');

  if (!profile) {
    return sendSuccess(res, {
      profile: {
        specialization: null,
        qualifications: [],
        experienceYears: 0,
        biography: '',
        consultationDuration: 30,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        isAvailable: true,
        isPublished: true,
      },
    });
  }

  return sendSuccess(res, { profile: toPublicDoctor(profile) });
});

export const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const data = req.body;

  const existing = await DoctorProfile.findOne({ user: req.user._id });
  const profile = existing
    ? Object.assign(existing, data)
    : new DoctorProfile({ user: req.user._id, ...data });

  await profile.save();

  await profile.populate('user', 'fullName email phone profileImage');
  return sendSuccess(res, { profile: toPublicDoctor(profile) });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ _id: req.params.id, isPublished: true }).populate('user', 'fullName email phone profileImage');
  if (!profile) {
    throw HttpError.notFound('Doctor profile not found.');
  }

  return sendSuccess(res, { profile: toPublicDoctor(profile) });
});
