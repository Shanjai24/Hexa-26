import os

file_path = r"c:\Users\Home\Desktop\Projects\Hexa-26\client\src\views\DepartmentDashboardView.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add virtual number and call button to header banner
old_header_target = """          <p className="text-xs text-slate-300 mt-1">
            Admin in charge: <strong className="text-white">{deptData?.department?.adminName || 'Department Admin'}</strong> ({deptData?.department?.adminEmail})
          </p>"""

new_header_snippet = """          <p className="text-xs text-slate-300 mt-1">
            Admin in charge: <strong className="text-white">{deptData?.department?.adminName || 'Department Admin'}</strong> ({deptData?.department?.adminEmail})
          </p>
          {deptData?.department?.virtualNumber && (
            <div className="mt-2.5 inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-lg text-xs font-mono text-blue-200">
              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct Virtual Line: {deptData.department.virtualNumber}</span>
            </div>
          )}"""

content = content.replace(old_header_target, new_header_snippet)

# 2. Add Test Call Line button next to switcher
old_switcher_end = """          </select>
        </div>
      </div>"""

new_switcher_end = """          </select>
          <button
            onClick={() => setCallModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Test Line</span>
          </button>
        </div>
      </div>"""

content = content.replace(old_switcher_end, new_switcher_end)

# 3. Add incomingCallAlert banner right after header banner
old_banner_end = """      </div>

      {/* KPI Stats Bar */}"""

new_banner_end = """      </div>

      {/* Live Incoming Virtual Line Call Alert */}
      {incomingCallAlert && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-blue-500/50 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5 animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Live Virtual Call Recorded
                </span>
                <span className="text-xs font-mono text-slate-300">
                  from {incomingCallAlert.phoneNumber}
                </span>
                {incomingCallAlert.mismatchWarning && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Department Mismatch Warning
                  </span>
                )}
                {incomingCallAlert.isFlaggedSpam && (
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Spam Flagged
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-1 italic line-clamp-2">
                "{incomingCallAlert.transcript || 'Audio call recorded on department virtual line.'}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate && onNavigate('calls')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View in Call Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIncomingCallAlert(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}"""

content = content.replace(old_banner_end, new_banner_end)

# 4. Add DepartmentCallModal before the final closing </div>
final_div = """      {selectedWorkerForInspection && (
        <WorkerInspectionModal 
          worker={selectedWorkerForInspection} 
          onClose={() => setSelectedWorkerForInspection(null)} 
        />
      )}
    </div>
  );
}"""

final_div_with_modal = """      {selectedWorkerForInspection && (
        <WorkerInspectionModal 
          worker={selectedWorkerForInspection} 
          onClose={() => setSelectedWorkerForInspection(null)} 
        />
      )}

      {/* Feature 8: Department Virtual Call Line Modal */}
      <DepartmentCallModal 
        isOpen={callModalOpen} 
        onClose={() => setCallModalOpen(false)} 
        initialDeptId={deptData?.department?.id || selectedDeptId}
        currentUser={currentUser}
      />
    </div>
  );
}"""

content = content.replace(final_div, final_div_with_modal)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully!")
