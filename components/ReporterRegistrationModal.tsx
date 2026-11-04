/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import {
  StateRecord,
  DistrictRecord,
  MandalRecord,
  getMandalsForDistrict,
} from '@/lib/india-locations';
import { UserPlus, Upload, CheckCircle2, AlertCircle, Shield, X } from 'lucide-react';

interface ReporterRegistrationModalProps {
  states: StateRecord[];
  districts: DistrictRecord[];
  mandals: MandalRecord[];
  onClose: () => void;
  onSuccess: (session: any) => void;
}

export const ReporterRegistrationModal: React.FC<ReporterRegistrationModalProps> = ({
  states,
  districts,
  mandals,
  onClose,
  onSuccess,
}) => {
  const activeStates = useMemo(() => states.filter((s) => s.active), [states]);

  const [fullName, setFullName] = useState('');
  const [fatherSpouseName, setFatherSpouseName] = useState('');
  const [dob, setDob] = useState('1992-06-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [mobile, setMobile] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [stateId, setStateId] = useState(activeStates[0]?.id || 'st-tg');

  const availableDistricts = useMemo(
    () => districts.filter((d) => d.stateId === stateId && d.active),
    [districts, stateId]
  );

  const [districtId, setDistrictId] = useState(availableDistricts[0]?.id || 'dt-tg-hyd');

  const availableMandals = useMemo(
    () => getMandalsForDistrict(districtId, mandals, districts, states),
    [districtId, mandals, districts, states]
  );

  const [mandalId, setMandalId] = useState(availableMandals[0]?.id || 'mn-hyd-khairatabad');
  const [villageTown, setVillageTown] = useState('');
  const [pinCode, setPinCode] = useState('500082');
  const [experience, setExperience] = useState('3 Years Print & Digital Journalism');
  const [previousOrganization, setPreviousOrganization] = useState('Local Press Network');
  const [photoUrl, setPhotoUrl] = useState('/icon.svg');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState('/icon.svg');
  const [photoFileName, setPhotoFileName] = useState('Default Press Avatar Ready');
  const [aadhaarFileName, setAadhaarFileName] = useState('Verified Sample ID Scan Ready');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsConsent, setTermsConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStateChange = (newStateId: string) => {
    setStateId(newStateId);
    const nextDistricts = districts.filter((d) => d.stateId === newStateId && d.active);
    const firstDistId = nextDistricts[0]?.id || '';
    setDistrictId(firstDistId);
    if (firstDistId) {
      const nextMandals = getMandalsForDistrict(firstDistId, mandals, districts, states);
      setMandalId(nextMandals[0]?.id || '');
    } else {
      setMandalId('');
    }
  };

  const handleDistrictChange = (newDistrictId: string) => {
    setDistrictId(newDistrictId);
    const nextMandals = getMandalsForDistrict(newDistrictId, mandals, districts, states);
    setMandalId(nextMandals[0]?.id || '');
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'photo' | 'aadhaar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (target === 'photo') {
        setPhotoUrl(result);
        setPhotoFileName(file.name);
      } else {
        setAadhaarDocUrl(result);
        setAadhaarFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!termsConsent) {
      setErrorMsg('You must accept the NETI BHARATHAM Press Terms & Privacy Consent.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER_REPORTER',
          payload: {
            fullName,
            fatherSpouseName,
            dob,
            gender,
            mobile,
            whatsappNumber: whatsappNumber || mobile,
            email,
            residentialAddress,
            stateId,
            districtId,
            mandalId,
            villageTown,
            pinCode,
            experience,
            previousOrganization,
            photoUrl,
            aadhaarDocUrl,
            username,
            password,
            termsConsent,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Registration failed.');
        setSubmitting(false);
        return;
      }

      onSuccess(data.session);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error submitting registration.');
      setSubmitting(false);
    }
  };

  const currentStateObj = states.find((s) => s.id === stateId);
  const subdivisionLabel = currentStateObj?.subdivisionTerm || 'Mandal';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-4xl mx-auto">
      <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b-4 border-red-700">
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <h2 className="text-lg font-extrabold tracking-wide">
              NETI BHARATHAM – PRESS REPORTER REGISTRATION (రిపోర్టర్ రిజిస్ట్రేషన్)
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Official accreditation form • 6-Month Digital Press ID issued upon Super Admin approval
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-300 hover:text-white rounded-md"
          aria-label="Close registration form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm">
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Personal Identity */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-700 pb-2 border-b border-slate-200">
            01. Personal Identity Details (వ్యక్తిగత వివరాలు)
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Full Name (పూర్తి పేరు) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Ch. Ramesh Babu"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Father / Husband Name *
              </label>
              <input
                type="text"
                required
                value={fatherSpouseName}
                onChange={(e) => setFatherSpouseName(e.target.value)}
                placeholder="Father or Spouse Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Date of Birth (పుట్టిన తేదీ) *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Gender (లింగం) *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-red-700"
              >
                <option value="Male">Male (పురుషుడు)</option>
                <option value="Female">Female (మహిళ)</option>
                <option value="Other">Other (ఇతర)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                5. Mobile Number (10 Digits) *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (!whatsappNumber) setWhatsappNumber(e.target.value);
                }}
                placeholder="9848012345"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6. WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="9848012345"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-red-700"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                7. Email Address (ఈమెయిల్) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reporter@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hierarchical Location & Address */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-700 pb-2 border-b border-slate-200">
            02. India Location Hierarchy &amp; Residential Address (రాష్ట్రం / జిల్లా / మండలం)
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                9. State / Union Territory (రాష్ట్రం) *
              </label>
              <select
                value={stateId}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-red-700"
              >
                {activeStates.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameEn} ({st.nameTe})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10. District (జిల్లా) *
              </label>
              <select
                value={districtId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-red-700"
              >
                {availableDistricts.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.nameEn} ({dt.nameTe})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                11. {subdivisionLabel} (మండలం / తాలూకా) *
              </label>
              <select
                value={mandalId}
                onChange={(e) => setMandalId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:border-red-700"
              >
                {availableMandals.map((mn) => (
                  <option key={mn.id} value={mn.id}>
                    {mn.nameEn} ({mn.nameTe})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                12. Village / Town / Ward (గ్రామం / పట్టణం) *
              </label>
              <input
                type="text"
                required
                value={villageTown}
                onChange={(e) => setVillageTown(e.target.value)}
                placeholder="Enter Village, Town, or Locality"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                13. PIN Code *
              </label>
              <input
                type="text"
                required
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="500082"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-red-700"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                8. Complete Residential Address (పూర్తి నివాస చిరునామా - Kept Confidential) *
              </label>
              <textarea
                rows={2}
                required
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(e.target.value)}
                placeholder="House No, Street, Colony, Mandal, District, State"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media Experience & Document Uploads */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-700 pb-2 border-b border-slate-200">
            03. Media Experience &amp; Confidential Verification Documents
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                14. Reporter Experience (అనుభవం) *
              </label>
              <input
                type="text"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                15. Previous Media Organization *
              </label>
              <input
                type="text"
                required
                value={previousOrganization}
                onChange={(e) => setPreviousOrganization(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                16. Profile Photograph (Passport Photo - JPG/PNG / Camera) *
              </label>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={photoUrl}
                  alt="Profile preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded object-cover border border-slate-300 bg-white"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5 text-red-700" />
                  <span>Select Photo / Camera</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    capture="user"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 truncate">{photoFileName}</p>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                17. Aadhaar Document Upload (Strict Private Vault - JPG/PNG/PDF) *
              </label>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-12 h-12 rounded border border-slate-300 bg-white flex items-center justify-center text-emerald-700">
                  <Shield className="w-6 h-6" />
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5 text-red-700" />
                  <span>Upload Aadhaar Document</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, 'aadhaar')}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                {aadhaarFileName} • Never exposed on public QR pages
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Account Credentials & Consent */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-700 pb-2 border-b border-slate-200">
            04. Login Credentials &amp; Consent
          </h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                18. Unique Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ramesh_hyd"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                19. Password (Min 8 chars) *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                20. Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-700"
              />
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-red-700 focus:ring-red-700"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>21. Terms &amp; Privacy Consent:</strong> I declare that the information and Aadhaar identification provided above are true and accurate. I understand my account starts in <strong>PENDING</strong> status, news upload is enabled only after Super Admin approval, and my Press ID card will be valid for <strong>6 calendar months</strong> from approval date.
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Submitting Application...' : 'Submit Reporter Application'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
